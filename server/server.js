const express = require('express');
const url = require('url');
const http = require('http');
const WebSocket = require("ws");
const {
  wsMessageHandler
} = require("./src/ws-message-handler");
const { startPing } = require("./src/start-ping");


const app = express();
const wss = new WebSocket.Server({ noServer: true });
const server = http.createServer(app).listen('8086');

wss.on("connection", (ws, req) => {
    ws.req = req;
    ws.isAlive = true;
    ws.on("pong", () => (ws.isAlive = true));
    ws.on("message", wsMessageHandler({ wss, ws }));
});

server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;
    
    if (pathname === '/') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws);

      });
    } else {
      socket.destroy();
    }
});

startPing({ wss, interval: 30 * 1000 });