const fs = require('fs');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');

const app = express();

// Load SSL Certificates
const server = https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
}, app);

// Create a WebSocket Server using HTTPS
const wss = new WebSocket.Server({ server });

let chatHistory = []; // Store messages

wss.on('connection', (ws) => {
    console.log('New secure client connected');

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

    ws.on('close', () => console.log('Secure WebSocket client disconnected'));
});

// Start the server on HTTPS port 443
server.listen(443, () => console.log('Secure WebSocket Server running on wss://localhost'));
