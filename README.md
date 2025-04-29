🔐 WebSocket Chat System – SecureChat
Welcome to SecureChat! This is a real-time, end-to-end encrypted chat application built with Node.js, WebSocket, React, and MongoDB. It supports secure messaging with user authentication, presence tracking, and file upload (in progress).

📚 Table of Contents
System Requirements

Installation

Running the Application

Using the Chat

Troubleshooting

Credits

📌 System Requirements
✔️ Windows 10/11 (64-bit) or Linux/macOS

✔️ Node.js v18+

✔️ MongoDB Atlas account

✔️ Internet connection for production mode

📦 Installation
🔁 1. Clone the Repository
git clone https://github.com/ashahmir12/websocket-chat.git
cd websocket-chat

🗃 2. Setup MongoDB Atlas
Create a free MongoDB Atlas cluster

Add your IP or enable 0.0.0.0/0 access temporarily

Create a database user and get your MONGO_URI

🔐 3. Create a .env File
Create a .env file in the root folder with:

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chatapp
JWT_SECRET=yourSuperSecretKey

🚀 Running the Application
▶️ Start the Backend Server
If running from source:

npm install
node server.js

Requires server.key and server.cert in the root directory.

If running the packaged .exe version:

cd dist/
./WebSocketChat.exe

▶️ Start the Frontend (React App)
If running from source:

cd frontend
npm install
npm start

Access it at: https://localhost:3000

💬 Using the Chat
1️⃣ Register an Account
Open the chat in browser

Enter a username and password

Click Register

2️⃣ Log In
Enter your credentials

Click Login

You’ll be connected to the chat via WebSocket

3️⃣ Send Messages
Select a user from the user list

Type a message

Click Send

4️⃣ Log Out
Click the Logout button to disconnect
