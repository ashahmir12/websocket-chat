const fs = require('fs');
const path = require('path');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
require('dotenv').config();

const app = express();

const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

AWS.config.update({
    region: 'us-west-1',
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const s3 = new AWS.S3();
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const allowedOrigins = [
    'https://localhost:3000',
    'https://127.0.0.1:3000',
    'https://192.168.1.107:3000',
    'https://192.168.56.1:3000',
    'https://websocket-chat.local:3000',
    'https://zippy-mooncake-2cb816.netlify.app',
    'https://websocketchat.secure-tech.org'
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

app.get('/ping', (req, res) => res.send('pong'));

app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
        res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Credentials", "true");
    res.header("Access-Control-Allow-Methods", "GET, POST");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") return res.status(200).end();
    next();
});

const SECRET_KEY = process.env.JWT_SECRET;

mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
    .then(() => console.log("✅ MongoDB Atlas Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

app.use(bodyParser.json());

const loginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 50,
    handler: (req, res) => {
        res.status(429).json({ message: "Too many login attempts. Please try again shortly." });
    }
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
        if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

        username = username.trim();
        password = password.trim();

        if (username.length < 3 || password.length < 6) {
            return res.status(400).json({ message: "Username must be at least 3 characters, and password at least 6 characters long." });
        }

        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ message: "Username already taken" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await new User({ username, password: hashedPassword }).save();

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
        if (!username || !password) return res.status(400).json({ message: "Username and password are required" });

        username = username.trim();
        password = password.trim();

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

app.post('/get-upload-url', async (req, res) => {
    const { filename, username } = req.body;

    if (!filename || !username) {
        return res.status(400).json({ error: 'Missing filename or username' });
    }

    const key = `${username}/${uuidv4()}-${filename}`;

    const params = {
        Bucket: BUCKET_NAME,
        Key: key,
        Expires: 60,
        ContentType: 'application/octet-stream'
    };

    try {
        const uploadUrl = await s3.getSignedUrlPromise('putObject', params);
        const fileUrl = `https://${BUCKET_NAME}.s3.${AWS.config.region}.amazonaws.com/${key}`;
        res.json({ uploadUrl, fileUrl });
    } catch (err) {
        console.error("❌ Failed to generate signed URL:", err);
        res.status(500).json({ error: 'Could not generate upload URL' });
    }
});

const connectedUsers = new Map();

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
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

    function broadcastUserList() {
        const users = Array.from(wss.clients)
            .filter(client => client.username)
            .map(client => client.username);

        const msg = JSON.stringify({ type: "users_list", users });

        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(msg);
            }
        });
    }

    ws.on('close', () => {
        clearInterval(heartbeatInterval);
        connectedUsers.delete(ws);
        console.log('❌ WebSocket Client disconnected');
        broadcastUserList();
    });

    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);

            if (data.type === "auth") {
                const decoded = jwt.verify(data.token, SECRET_KEY);
                ws.username = decoded.username;
                connectedUsers.set(ws, ws.username);

                ws.send(JSON.stringify({ type: "auth_success", username: ws.username }));
                broadcastUserList();

            } else if (data.type === "message") {
                if (!ws.username) return ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
                if (isRateLimited(ws.username)) return ws.send(JSON.stringify({ type: "error", message: "You're sending messages too fast." }));

                const msg = {
                    username: ws.username,
                    to: data.to,
                    message: data.message
                };

                const logDir = path.join(__dirname, 'logs');
                if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

                const participants = [ws.username, data.to].sort().join('_');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const sessionKey = `${participants}_${timestamp}`;

                if (!ws.logFileMap) ws.logFileMap = {};
                if (!ws.logFileMap[participants]) {
                    const sessionLog = path.join(logDir, `${sessionKey}.txt`);
                    ws.logFileMap[participants] = sessionLog;
                }

                const logMessage = `[${new Date().toISOString()}] ${ws.username} → ${data.to}: ${data.message}\n`;
                fs.appendFileSync(ws.logFileMap[participants], logMessage);

                wss.clients.forEach(client => {
                    const recipient = connectedUsers.get(client);
                    if (client.readyState === WebSocket.OPEN && (recipient === data.to || recipient === ws.username)) {
                        client.send(JSON.stringify({ type: "message", ...msg }));
                    }
                });

            } else if (data.type === "file") {
                if (!ws.username) return ws.send(JSON.stringify({ type: "error", message: "Authentication required" }));
                if (!data.to || !data.url || !data.filename) {
                    return ws.send(JSON.stringify({ type: "error", message: "Missing file data." }));
                }

                const msg = {
                    from: ws.username,
                    to: data.to,
                    url: data.url,
                    filename: data.filename
                };

                wss.clients.forEach(client => {
                    const recipient = connectedUsers.get(client);
                    if (client.readyState === WebSocket.OPEN && (recipient === data.to || recipient === ws.username)) {
                        client.send(JSON.stringify({ type: "file", ...msg }));
                    }
                });
            }

        } catch (err) {
            console.error("❌ Error handling WebSocket message:", err);
        }
    });
});

const PORT = process.env.PORT || 8443;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Secure WebSocket Server running on wss://0.0.0.0:${PORT}`);
});
