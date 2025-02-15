const fs = require('fs');
const path = require('path');
const https = require('https');
const express = require('express');
const WebSocket = require('ws');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');

const app = express();
const cors = require('cors');
app.use(cors({
    origin: "https://localhost:3000",  // Allow requests from React frontend
    credentials: true
}));

const SECRET_KEY = "supersecretkey"; // Change this for production

// 🔹 Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/chatapp')  // 🔹 Fixed: Use 127.0.0.1 instead of localhost
    .then(() => console.log("✅ MongoDB Connected"))
    .catch(err => console.error("❌ MongoDB Connection Error:", err));

// 🔹 User Schema & Model
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(bodyParser.json());

// 🔹 Rate Limiting for Login (Prevent Brute Force)
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit to 5 login attempts per 15 minutes
    message: "Too many login attempts. Please try again later."
});

// 🔹 Add Rate Limiting for Chat Messages
const messageRateLimits = {}; // Store last message timestamps per user

function isRateLimited(username) {
    const now = Date.now();
    if (messageRateLimits[username] && now - messageRateLimits[username] < 1000) {
        return true; // User is sending messages too fast
    }
    messageRateLimits[username] = now;
    return false;
}

// 🔹 User Registration Route
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: "Username already taken" });
        }

        // Hash the password
        const hashedPassword = bcrypt.hashSync(password, 10);
        const newUser = new User({ username, password: hashedPassword });

        // Save to database
        await newUser.save();
        res.json({ message: "User registered successfully" });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// 🔹 User Login Route
app.post('/login', loginLimiter, async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check user in the database
        const user = await User.findOne({ username });
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Generate JWT Token
        const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });

        res.json({ token });

    } catch (err) {
        res.status(500).json({ message: "Internal server error" });
    }
});

// 🔹 Secure WebSocket Server Setup
const server = https.createServer({
    key: fs.readFileSync(path.join(__dirname, 'server.key')),
    cert: fs.readFileSync(path.join(__dirname, 'server.cert'))
}, app);

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws, req) => {
    console.log('New secure client connected');

    // Heartbeat: Detect inactive clients
    ws.isAlive = true;
    ws.on('pong', () => {
        ws.isAlive = true;
    });

    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach(client => {
            if (!client.isAlive) {
                console.log('Client disconnected due to inactivity');
                return client.terminate();
            }
            client.isAlive = false;
            client.ping();
        });
    }, 30000); // Check every 30 seconds

    ws.on('close', () => {
        clearInterval(heartbeatInterval);
        console.log('Client disconnected');
    });

    // Handle authentication
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

                // 🔹 Apply Rate Limiting (1 message per second per user)
                if (isRateLimited(ws.username)) {
                    ws.send(JSON.stringify({ type: "error", message: "You're sending messages too fast. Please slow down!" }));
                    return;
                }

                const chatMessage = { username: ws.username, message: data.message };

                // Broadcast to all clients
                wss.clients.forEach(client => {
                    if (client.readyState === WebSocket.OPEN) {
                        client.send(JSON.stringify({ type: "message", ...chatMessage }));
                    }
                });
            }
        } catch (err) {
            console.error("Error handling message:", err);
        }
    });

    ws.on('close', () => console.log('Client disconnected'));
});

// 🔹 Start HTTPS WebSocket Server
server.listen(443, () => console.log('✅ Secure WebSocket Server running on wss://localhost'));
