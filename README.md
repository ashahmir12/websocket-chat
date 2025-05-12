# 🔐 SecureChat – WebSocket Chat System
SecureChat is a real-time, end-to-end encrypted chat platform built with Node.js, WebSocket (WSS), React, and MongoDB Atlas. It supports:

- 🔒 Secure JWT-based user authentication
- 🧠 Live presence indicators and user list
- 💬 One-on-one messaging with emoji and markdown support
- 📁 File sharing via AWS S3 (secure uploads with signed URLs)
- 🌐 Deployed frontend via Netlify and backend on Render

## 📚 Table of Contents
- System Requirements
- Installation
- Environment Variables
- Running the Application
- Using the Chat
- Troubleshooting
- Credits

## ✔️ System Requirements
- Windows 10/11 (64-bit), Linux, or macOS
- Node.js v18 or later
- MongoDB Atlas account
- AWS S3 bucket (for file sharing)
- Internet connection (for cloud deployment)

## 📦 Installation

### 🔁 1. Clone the Repository
git clone https://github.com/ashahmir12/websocket-chat.git
cd websocket-chat

### 🗃 2. Set Up MongoDB Atlas
- Create a free cluster at https://www.mongodb.com/cloud/atlas
- Add your IP or allow global access (0.0.0.0/0)
- Create a database user and copy the Connection URI

## 🔐 Environment Variables
Create a `.env` file in the project root:

MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/chatapp
JWT_SECRET=yourSuperSecretKey
AWS_ACCESS_KEY_ID=yourAwsAccessKey
AWS_SECRET_ACCESS_KEY=yourAwsSecretKey
S3_BUCKET_NAME=your-s3-bucket-name

For deployment, these variables must also be added in Render > Environment > Environment Variables.

## 🚀 Running the Application

### ▶️ Start the Backend (Node.js + WebSocket)
npm install
node server.js

Alternatively, you can deploy to Render for cloud hosting.

### ▶️ Start the Frontend (React App)
cd frontend
npm install
npm start

Access it at:
http://localhost:3000

Or view live deployment:
https://zippy-mooncake-2cb816.netlify.app

## 💬 Using the Chat

### 1️⃣ Register or Log In
- Enter a username and password
- Click Register (first time) or Login

### 2️⃣ Chat with Online Users
- Select a user from the dropdown list
- Send formatted messages using markdown:
  - **bold**, _italic_, [link](https://example.com)
- Emojis supported via integrated picker
- Typing indicators and presence tracking enabled

### 3️⃣ Upload & Share Files
- Click Choose File to select any file
- Click Send File to securely upload to S3
- Recipient receives a clickable file link in chat

### 4️⃣ Log Out
- Click Logout to disconnect and clear session

## 🧪 Troubleshooting

- WebSocket not connecting?
  Ensure your backend is running on Render and your frontend has the correct wss:// URL.

- File upload not working?
  Check your AWS S3 bucket permissions. Make sure you’ve disabled Block Public Access and added a public-read bucket policy.

- Netlify build fails?
  Ensure you’ve installed all dependencies (emoji-picker-react, etc.) and specified Node version if needed.

## 👥 Credits
- Built by @ashahmir12
- Cloud hosting: Render, Netlify, MongoDB Atlas, AWS S3
- Emoji Picker: emoji-picker-react

🔒 SecureChat is under active development. Contributions and feedback are welcome!
