#!/usr/bin/env node
const fs = require('fs');
const ospath = require('ospath');
const path = require('path');
const server = require('../server');

const PROGRAM = require('../package.json').name;

var configDir = path.join(ospath.data(), PROGRAM);
var configFile = path.join(ospath.data(), PROGRAM, 'config.js');
var config;

console.log('');
console.log('Bitcoin Node Monitor');

if (process.argv.length < 3) {
  if (!fs.existsSync(configFile)) {
    console.log('');
    console.log('No configuration file found');
    console.log('');
    console.log('Creating ' + configFile);
    fs.mkdirSync(configDir, { recursive: true });
    fs.copyFileSync(path.join(__dirname, '../config.js'), configFile);
    console.log('Please edit ' + configFile);
    console.log('');
    console.log('You can also specify a config file manually:');
    console.log('bitcoin-node-monitor -c <CONFIGFILE>');
    process.exit(1);
  }

  config = require(configFile);
} else if (process.argv.length > 3 && process.argv[2] === '-c' && typeof process.argv[3] === 'string') {
  configFile = path.resolve(process.argv[3]);

  if (!fs.existsSync(configFile)) {
    console.log('File not found: ' + configFile);
    process.exit(1);
  }

  config = require(configFile);
} else {
  console.log('');
  console.log('Usage: bitcoin-node-monitor [-c <CONFIGFILE>]');
  console.log('');
  console.log('Default configuration file: ' + configFile);
  process.exit(1);
}

server(config);
