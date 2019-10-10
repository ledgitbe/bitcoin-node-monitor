#!/usr/bin/env node
const express = require('express');
const compression = require('compression')
const cors = require('cors')
const BitcoinRPC = require('bitcoin-rpc-promise');
const path = require('path');
const range = require('lodash.range');
const get = require('lodash.get');
const timeoutify = require('timeoutify-promise');
const interval = require('interval-promise')
const fs = require("fs");

var config = require('../config.js');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const rpcCalls = [ 'getblockchaininfo', 'getchaintips', 'getmempoolinfo', 'getmininginfo' ];

const rpc = {}; // contains BitcoinRPC
const nodes = {}; // contains data

const TIMEOUT = process.env.TIMEOUT || 32000;
const WAIT = process.env.WAIT || 5000;
const BLOCKCOUNT = process.env.BLOCKCOUNT || 7;
const MEMPOOLSIZE_EMIT_THRESHOLD = process.env.MEMPOOLSIZE_EMIT_THRESHOLD || 100; // txs extra needed before we broadcast
const CLIENT_PATH = '../client/build';

async function setup() {
  await Promise.all(Object.entries(config.nodes).map(async ([id, node]) => {
    // Create RPC object
    rpc[id] = new BitcoinRPC(`http://${node.user}:${node.password}@${node.host}:${node.port}`);

    // Initialize state
    nodes[id] = {
      id,
      name: node.name,
      online: false,
      rpc: {},
      blocks: {},
    };
  }));
}

function mergeObject(final, each) {
  return Object.assign(final, each);
}

async function getLastBlocks(id, blockHeight) {
  let node = nodes[id];
  let nodeRpc = rpc[id];

  let blocks = {};

  blocks = await Promise.all(range(blockHeight, blockHeight - BLOCKCOUNT, -1).map(async (height) => {
    return { [height]: await timeoutify(nodeRpc.call('getblockhash', height), TIMEOUT)};
  })).then(results => results.reduce(mergeObject, {}));

  return blocks;
}

async function update() {
  let mustEmit = false;
  // Get data for all nodes
  await Promise.all(Object.entries(rpc).map(async ([id, nodeRpc]) => {
    let node = nodes[id];
    // Get every rpc call or consider node offline if one fails

    let results;
    try {
      results = await Promise.all(rpcCalls.map(rpcCall => timeoutify(nodeRpc.call(rpcCall), TIMEOUT).then(result => [rpcCall, result])))
      await Promise.all(results.map(async ([rpcCall, result]) => {
        if (rpcCall === "getblockchaininfo" && result.bestblockhash !== get(node, 'rpc.getblockchaininfo.bestblockhash')) {
          mustEmit = true;
          node.blocks = await getLastBlocks(id, result.blocks);
        }

        // If the node gained MEMPOOLSIZE_EMIT_THRESHOLD transactions more since last time, we must emit
        if (rpcCall === "getmempoolinfo" && result.size > get(node, 'rpc.getmempoolinfo.size') + MEMPOOLSIZE_EMIT_THRESHOLD) {
          mustEmit = true;
        }

        node.rpc[rpcCall] = result;
        node.online = true;

        node.hasSplit = false;
        node.hasDiverged = false;
        node.isBehind = false;
        node.hasReorged = false;
        node.hasMostWork = false;
      }));
    } catch(e) {
      node.online = false;
    }
  }));

  // Get some overall stats from all online nodes
  let maxHeaders = 0;
  let maxBlocks = 0;
  let maxChainwork = '';
  Object.entries(nodes).filter(([id, node]) => node.online).forEach(([id, node]) => {
    maxHeaders = maxHeaders < node.rpc.getblockchaininfo.headers ? node.rpc.getblockchaininfo.headers : maxHeaders;
    maxBlocks = maxBlocks < node.rpc.getblockchaininfo.blocks ? node.rpc.getblockchaininfo.blocks : maxBlocks;
    maxChainwork = maxChainwork < node.rpc.getblockchaininfo.chainwork ? node.rpc.getblockchaininfo.chainwork : maxChainwork;
  });

  // For each node, decide what's going on
  await Promise.all(Object.entries(nodes).filter(([id, node]) => node.online).map(async ([id, node]) => {
    node.isBehind = (() => {
      // find all nodes with the same block on the same height aka same chain
      let [ _height, _hash] = Object.entries(node.blocks)[Math.floor(BLOCKCOUNT/2)]; //somewhere in the middle
      let nodesOnSameChain = Object.entries(nodes).filter(([id, node]) => node.blocks[_height] === _hash);
      let maxHeadersSameChain = 0;
      nodesOnSameChain.forEach(([id, node]) => {
        maxHeadersSameChain = maxHeadersSameChain < node.rpc.getblockchaininfo.headers ? node.rpc.getblockchaininfo.headers : maxHeadersSameChain;
      });

      return node.rpc.getblockchaininfo.headers < maxHeadersSameChain;
    })();
    node.isSyncing = node.rpc.getblockchaininfo.blocks < node.rpc.getblockchaininfo.headers;
    node.hasMostWork = node.rpc.getblockchaininfo.chainwork === maxChainwork;

    // hasReorged
    let forks = node.rpc.getchaintips.filter(tip => tip.status === "valid-fork" && tip.height > node.rpc.getblockchaininfo.headers - 1000);

    if (forks.length > 0){
      node.hasReorged = forks[0].height;
      node.hasSplit = false;
      node.hasDiverged = false;
    } else {
      node.hasReorged = false;
    }


    // hasSplit
    // check if current node is behind
    if (node.rpc.getblockchaininfo.chainwork < maxChainwork) {
      // node is behind, check if syncing with longest chain
      // const longestNodeId = Object.keys(nodes).find(key => key !== node.id && nodes[key].online === true && nodes[key].rpc.getblockchaininfo.blocks >= maxBlocks);
      const longestNodeId = Object.keys(nodes).find(key => key !== node.id && nodes[key].online === true && nodes[key].rpc.getblockchaininfo.chainwork >= maxChainwork);
      const longestNodeRpc = rpc[longestNodeId];

      if (longestNodeRpc) {
        await timeoutify(longestNodeRpc.call('getblockhash', node.rpc.getblockchaininfo.blocks), TIMEOUT).then(result => {
          if (result !== node.rpc.getblockchaininfo.bestblockhash) {
            //best block not found in longest chain, split happened!

            console.log(' < maxBlocks', 'setting hasSplit true on', node.id);
            console.log('Asked blockhash of height', node.rpc.getblockchaininfo.blocks);
            console.log('LongestNode (', longestNodeId, ') responds with', result);
            console.log(node.id, '\'value is', node.rpc.getblockchaininfo.bestblockhash);
            console.log('GETBLOCKCHAININFO.BLOCKS', node.rpc.getblockchaininfo.blocks);

            node.hasDiverged = true;
          }
        }).catch(err => {
          node.online = false;
        });
      }
    } else if (node.rpc.getblockchaininfo.blocks === maxBlocks) {
      const longestNodes = Object.entries(nodes).filter(([id, longNode]) => node.id !== longNode.id && longNode.online === true && longNode.rpc.getblockchaininfo.blocks >= maxBlocks);
      longestNodes.forEach(([id, cmpNode]) => {
        if (node.blocks[node.rpc.getblockchaininfo.blocks] &&
          node.blocks[node.rpc.getblockchaininfo.blocks -1] &&
          cmpNode.blocks[node.rpc.getblockchaininfo.blocks] &&
          cmpNode.blocks[node.rpc.getblockchaininfo.blocks -1] &&
          node.blocks[node.rpc.getblockchaininfo.blocks] !== cmpNode.blocks[node.rpc.getblockchaininfo.blocks] &&
          node.blocks[node.rpc.getblockchaininfo.blocks -1] !== cmpNode.blocks[node.rpc.getblockchaininfo.blocks]) {
          node.hasSplit = true;
          console.log(`checking for split at ${maxBlocks}`);
          console.log('setting hasSplit true on', node.id);
        }
      }
      );
    }

    return true;
  }));


  /// ALL DONE!
  // every node is queried and considered, send update
  // TODO: differential updates
  if (mustEmit) {
    io.emit('action', { type: 'UPDATE', data: nodes });
  }

  return true;
}

io.on('connection', function (socket) {
  socket.emit('action', { type: 'UPDATE', data: nodes });
});

app.use(compression())
app.use(cors());

app.get('/ping', function (req, res) {
  return res.send('pong');
});

if (fs.existsSync(path.join(__dirname, CLIENT_PATH))) {
  app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, CLIENT_PATH, 'index.html'));
  });
  app.use(express.static(path.join(__dirname, CLIENT_PATH)));
} else {
  app.get('/', function (req, res) {
    res.send(`Could not find ${path.join(__dirname, CLIENT_PATH)}. No web client available, but you can still use socket.io-client to connect`);
  });
}

app.get('/stats.json', function (req, res) {
  const stats = {
    connections: Object.keys(io.sockets.sockets).length,
  }
  return res.json(stats);
});

app.use(function (err, req, res, next) {
  console.error(err.message)
  res.status(400).send(err.message)
})


const main = (async (runtimeConfig) => {
  config = runtimeConfig || config;

  app.set('port', process.env.PORT || config.port || 4343);

  server.listen(app.get('port'), function () {
    console.log('Server listening at port', app.get('port'));
  });

  await setup();

  interval(async () => {
    await update();
  }, WAIT);

  return server;
});

if (require.main === module) {
  main();
}

module.exports = exports = main;
