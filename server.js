const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let chatHistory = []; // Store message history

wss.on('connection', (ws) => {
    console.log('New client connected');

    // Send chat history to new client
    ws.send(JSON.stringify({ type: 'history', messages: chatHistory }));

    ws.on('message', (data) => {
        const messageData = JSON.parse(data);
        console.log(`Received: ${messageData.username}: ${messageData.message}`);

        // Avoid duplicate messages
        if (!chatHistory.find(msg => msg.username === messageData.username && msg.message === messageData.message)) {
            const chatMessage = { username: messageData.username, message: messageData.message };
            chatHistory.push(chatMessage);

            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify({ type: 'message', ...chatMessage }));
                }
            });
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

server.listen(3000, () => console.log('Server running on port 3000'));
