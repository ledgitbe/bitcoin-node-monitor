const port = 4343;
const nodes = {
  'myNode' : { name: 'Bitcoin SV v0.1.0', host: '192.168.0.11', port: 48332, user: 'user', password: 'password'},
  'myOtherNode': { name: 'Bitcoin ABC v0.18.2', host: '192.168.0.10', port: 38332, user: 'user', password: 'password'},
};

module.exports = { nodes, port };
