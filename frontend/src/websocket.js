export const createWebSocket = (setSocket, token, setMessages, setUserList, selectedUser, username) => {
    const ws = new WebSocket(`wss://${window.location.hostname}:8443`);

    ws.onopen = () => {
        console.log('Connected to WebSocket server');
        ws.send(JSON.stringify({ type: "auth", token }));
    };

    ws.onmessage = (event) => {
        const data = JSON.parse(event.data);

        if (data.type === "auth_success") {
            console.log("WebSocket Authenticated as:", data.username);
            setUserList(prev => [...new Set([...prev, data.username])]);
        } else if (data.type === "message") {
            const from = data.username;
            const to = data.to;

            if (from === selectedUser || to === selectedUser) {
                setMessages(prev => [...prev, { username: from, message: data.message }]);
            }

            if (from !== username) {
                setUserList(prev => [...new Set([...prev, from])]);
            }
        }
    };

    ws.onclose = () => {
        console.log('WebSocket Disconnected, attempting to reconnect...');
        setTimeout(() => {
            createWebSocket(setSocket, token, setMessages, setUserList, selectedUser, username);
        }, 3000);
    };

    setSocket(ws);

    setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "ping" }));
        }
    }, 25000);

    return ws;
};