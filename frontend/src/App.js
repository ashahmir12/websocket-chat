import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
    const [socket, setSocket] = useState(null);
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);

    useEffect(() => {
        if (!token) return;

        let ws = new WebSocket('wss://localhost:443'); // ✅ Explicitly using port 443

        ws.onopen = () => {
            console.log('Connected to WebSocket server');
            ws.send(JSON.stringify({ type: "auth", token }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "auth_success") {
                console.log("WebSocket Authenticated as:", data.username);
            } else if (data.type === "message") {
                setMessages(prev => [...prev, { username: data.username, message: data.message }]);
            }
        };

        ws.onclose = () => {
            console.log('WebSocket Disconnected, attempting to reconnect...');
            setTimeout(() => {
                setSocket(new WebSocket('wss://localhost:443'));
            }, 3000);
        };

        setSocket(ws);

        const heartbeat = setInterval(() => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: "ping" }));
            }
        }, 25000);

        return () => {
            clearInterval(heartbeat);
            ws.close();
        };
    }, [token]);

    const register = async () => {
        try {
            const res = await fetch('https://localhost:443/register', { // ✅ Explicitly using port 443
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // ✅ Allow credentials in request
            });
            if (res.ok) {
                alert("User registered! Please log in.");
            } else {
                const data = await res.json();
                alert(data.message);
            }
        } catch (err) {
            console.error("Registration failed", err);
        }
    };

    const login = async () => {
        try {
            const res = await fetch('https://localhost:443/login', { // ✅ Explicitly using port 443
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include' // ✅ Allow credentials in request
            });

            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("Login failed", err);
        }
    };

    const sendMessage = () => {
        if (socket && message.trim()) {
            socket.send(JSON.stringify({ type: "message", message }));
            setMessage('');
        }
    };

    return (
        <div className="chat-container">
            {!token ? (
                <>
                    <h2>Login to Chat</h2>
                    <input type="text" placeholder="Username" onChange={(e) => setUsername(e.target.value)} />
                    <input type="password" placeholder="Password" onChange={(e) => setPassword(e.target.value)} />
                    <button onClick={register}>Register</button>
                    <button onClick={login}>Login</button>
                </>
            ) : (
                <>
                    <h2>Welcome, {username}</h2>
                    <button onClick={() => setToken(null)}>Logout</button>
                    <div className="messages">
                        {messages.map((msg, index) => (
                            <div key={index}><strong>{msg.username}:</strong> {msg.message}</div>
                        ))}
                    </div>
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type a message..." />
                    <button onClick={sendMessage}>Send</button>
                </>
            )}
        </div>
    );
};

export default App;
