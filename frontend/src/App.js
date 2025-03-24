import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import EmojiPicker from 'emoji-picker-react'; 

const App = () => {
    const [socket, setSocket] = useState(null);
    const [token, setToken] = useState(null);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [userList, setUserList] = useState([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!token) return;

        const ws = new WebSocket(`wss://${window.location.hostname}:8443`);
        socketRef.current = ws;

        ws.onopen = () => {
            console.log('✅ Connected to WebSocket server');
            ws.send(JSON.stringify({ type: "auth", token }));
        };

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "auth_success") {
                console.log("✅ Authenticated as:", data.username);
            } else if (data.type === "users_list") {
                setUserList(data.users.filter(u => u !== username));
            } else if (data.type === "message") {
                const { username: from, to, message } = data;

                if (from === username || to === username) {
                    setMessages(prev => [...prev, { from, to, message }]);
                }
            }
        };

        ws.onclose = () => {
            console.log('❌ WebSocket Disconnected. Reconnecting...');
            setTimeout(() => setSocket(null), 3000);
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
    }, [token, username]);

    const register = async () => {
        try {
            const res = await fetch(`https://${window.location.hostname}:8443/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            if (res.ok) {
                alert("✅ User registered! Please log in.");
            } else {
                const data = await res.json();
                alert(`❌ ${data.message}`);
            }
        } catch (err) {
            console.error("❌ Registration failed", err);
        }
    };

    const login = async () => {
        try {
            const res = await fetch(`https://${window.location.hostname}:8443/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await res.json();
            if (res.ok) {
                setToken(data.token);
            } else {
                alert(data.message);
            }
        } catch (err) {
            console.error("❌ Login failed", err);
        }
    };

    const formatMessage = (msg) => {
        return msg
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/_(.*?)_/g, '<i>$1</i>')
            .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    };

    const sendMessage = () => {
        if (socket && message.trim() && selectedUser) {
            const formatted = formatMessage(message);
            socket.send(JSON.stringify({
                type: "message",
                to: selectedUser,
                message: formatted
            }));
            setMessage('');
        }
    };

    const handleEmojiClick = (event, emojiObject) => {
        setMessage(prev => prev + emojiObject.emoji); 
        setShowEmojiPicker(false);
    };

    const handleSelectUser = (newUser) => {
        setSelectedUser(newUser);
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

                    <div className="user-selector">
                        <h3>Chat With:</h3>
                        <select value={selectedUser} onChange={(e) => handleSelectUser(e.target.value)}>
                            <option value="">-- Select User --</option>
                            {userList.map(user => (
                                <option key={user} value={user}>{user}</option>
                            ))}
                        </select>
                    </div>

                    <div className="messages">
                        {messages
                            .filter(msg =>
                                (msg.from === selectedUser && msg.to === username) ||
                                (msg.from === username && msg.to === selectedUser)
                            )
                            .map((msg, index) => (
                                <div key={index}>
                                    <strong>{msg.from}:</strong>{" "}
                                    <span dangerouslySetInnerHTML={{ __html: msg.message }} />
                                </div>
                            ))}
                    </div>

                    <div className="input-section">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Type a message..."
                        />
                        <button onClick={() => setShowEmojiPicker(!showEmojiPicker)}>😊</button>
                        <button onClick={sendMessage}>Send</button>
                    </div>

                    {showEmojiPicker && (
                        <div className="emoji-picker">
                            <EmojiPicker onEmojiClick={handleEmojiClick} />
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default App;
