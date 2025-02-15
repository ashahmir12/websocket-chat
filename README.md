# websocket-chat
📖 WebSocket Chat System - User Guide
Welcome to the WebSocket Chat System! This guide will help you install, run, and use the chat application.

📌 Table of Contents
System Requirements
Installation
Running the Application
Using the Chat
Troubleshooting
📌 System Requirements
✔️ Windows 10/11 (64-bit)
✔️ MongoDB installed and running

📌 Installation
1️⃣ Download the application

If you have the .zip file, extract it to a folder.
If using GitHub, clone the repository:
sh
Copy
Edit
git clone https://github.com/ashahmir12/websocket-chat.git
2️⃣ Ensure MongoDB is running

Open a terminal and start MongoDB:
sh
Copy
Edit
mongod
3️⃣ Copy SSL Certificates (Only if running the packaged version)

Copy server.key and server.cert to the dist/ folder.
📌 Running the Application
🖥️ Start the Backend (Server)
If using the packaged version:
sh
Copy
Edit
cd dist
server-win.exe
If running from source code:
sh
Copy
Edit
node server.js
🖥️ Start the Frontend (Chat App)
Run WebSocketChat.exe (from frontend/dist/ folder)
OR, if running from source code:
sh
Copy
Edit
cd frontend
npm start
📌 Using the Chat
1️⃣ Register an Account
Open the chat app.
Enter a username and password.
Click Register.
Once registered, log in with the same credentials.
2️⃣ Log In
Enter your username and password.
Click Login to access the chat.
3️⃣ Send Messages
Type a message in the input box.
Click Send to chat with connected users.
4️⃣ Log Out
Click Logout to disconnect from the chat.
