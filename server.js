const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');

const app = express();
const cors = require('cors');

const allowedOrigins = [
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://192.168.1.107:3000', 
    'https://192.168.56.1:3000'   
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
        return res.status(200).end();
    }

    next();
});

const SECRET_KEY = "supersecretkey";

mongoose.connect('mongodb://127.0.0.1:27017/chatapp', {
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: "Too many login attempts. Please try again later."
});

const messageRateLimits = {};

function isRateLimited(username) {
    const now = Date.now();
    if (messageRateLimits[username] && now - messageRateLimits[username] < 1000) {
        return true;
    }
    messageRateLimits[username] = now;
    return false;
}

app.post('/register', async (req, res) => {
    try {
        let { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        username = String(username).trim();
        password = String(password).trim();

        console.log(`🔍 Debugging Registration - Username: ${username}, Password: ${password}`);

        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({ message: "Username must be at least 3 characters, and password at least 6 characters long." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        console.log(`🔹 Hashing password for user: ${username}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        console.log(`✅ User registered successfully: ${username}`);
        res.status(201).json({ message: "User registered successfully" });

    } catch (err) {
        console.error("❌ Registration Error:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
});

app.post('/login', loginLimiter, async (req, res) => {
    try {
        let { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: "Username and password are required" });
        }

        username = String(username).trim();
        password = String(password).trim();

        const user = await User.findOne({ username });
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ token });

    } catch (err) {
        console.error("❌ Login Error:", err);
        res.status(500).json({ message: "Internal server error" });
    }
});

const server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
}, app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    console.log('✅ New secure WebSocket client connected');

    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });

    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach(client => {
            if (!client.isAlive) {
                console.log('❌ Client disconnected due to inactivity');
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        });
    }, 30000);

    ws.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log('❌ WebSocket Client disconnected');
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === "auth") {
                try {
                    const decoded = jwt.verify(data.token, SECRET_KEY);
                    ws.username = decoded.username;
                    ws.send(JSON.stringify({ type: "auth_success", username: decoded.username }));
                } catch (err) {
                    ws.send(JSON.stringify({ type: "auth_error", message: "Invalid token" }));
                    ws.close();
                }
            } else if (data.type === "message") {
                if (!ws.username) {
                    ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
                    return;
                }

                if (isRateLimited(ws.username)) {
                    ws.send(JSON.stringify({ type: "error", message: "You're sending messages too fast. Please slow down!" }));
                    return;
                }

                const chatMessage = { username: ws.username, message: data.message };

                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "message", ...chatMessage }));
                    }
                });
            }
        } catch (err) {
            console.error("❌ Error handling WebSocket message:", err);
        }
    });

    ws.on('close', () => console.log('❌ Client disconnected'));
});

server.listen(8443, '0.0.0.0', () => {
    console.log('✅ Secure WebSocket Server running on wss://0.0.0.0:8443');
});