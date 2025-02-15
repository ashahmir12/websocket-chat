const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const users = { user1: 'password1', user2: 'password2' }; // Dummy users
const SECRET_KEY = 'supersecretkey';

app.use(bodyParser.json());

// Rate limiting
const limiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10, // Max messages per minute
    message: "Too many requests. Please slow down."
});

// Authentication Endpoint
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (users[username] && users[username] === password) {
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
        return res.json({ token });
    }
    res.status(401).json({ message: 'Invalid credentials' });
});

// WebSocket Connection Handling
wss.on('connection', (ws) => {
    console.log('New client connected');

    ws.on('message', (message) => {
        console.log(`Received: ${message}`);
        wss.clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });

    ws.on('close', () => console.log('Client disconnected'));
});

server.listen(3000, () => console.log('Server running on port 3000'));
