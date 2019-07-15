'use strict';

const http = require('http');
const fs = require('fs');
const yaml = require('js-yaml');
const WebSocket = require('ws');

// const server = http.createServer((req, res) => {
//   req.addListener('end', () => file.serve(req, res)).resume();
// });
// const port = 3210;
// server.listen(port, () => console.log(`Server running at http://localhost:${port}`));

let config;

try {
  config = yaml.safeLoad(fs.readFileSync('./config.yaml', 'utf8'));
} catch (e) {
  console.log(e);
}

let rooms = {};

const wss = new WebSocket.Server({
  port: config.port,
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed.
  }
}, () => {
  console.log('WSS started.');
});

wss.on('connection', (ws, req) => {
  ws.send(JSON.stringify({
    type: 'community',
    payload: config.community
  }));

  ws.on('message', (data) => {
    let json;

    try {
      json = JSON.parse(data);
    } catch (err) {
      console.error(err);
    }

    if (json && json.connection) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    } else if (json && json.request) {
      if (json.request === 'clientCount') {
        ws.send(JSON.stringify({clientCount: wss.clients.size}));
      }
    }
  });
});
