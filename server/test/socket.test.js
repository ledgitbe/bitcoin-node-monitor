const io = require('socket.io-client');
const expect = require('chai').expect;
const server = require('../index.js');
const config = require('../../config.js');

const nodes = {
  'myNode' : { name: 'Bitcoin SV v0.1.0', host: '192.168.0.11', port: 48332, user: 'user', password: 'password'},
  'myOtherNode': { name: 'Bitcoin ABC v0.18.2', host: '192.168.0.10', port: 38332, user: 'user', password: 'password'},
};


var socket;

const rpcCalls = [ 'getblockcount', 'getblockchaininfo', 'getchaintips' ];

describe('Socket connection', () => {
  it('should receive UPDATE action on connection', async () => {
    var TestServer = await server({ nodes });

    socket = io(`http://localhost:4343`, { reconnection: false });
    var counter = 0;

    socket.on('action', async (socketRes) => {
      if (socketRes.type !== 'UPDATE') {
        return;
      }

      expect(socket.connected).to.be.equal(true);
      expect(socketRes).to.have.property('data');
      expect(socketRes.data).to.have.property('myNode');
      expect(socketRes.data).to.have.property('myOtherNode');
      await TestServer.close();
      await socket.close();
    });
  }).timeout(10000);
});
