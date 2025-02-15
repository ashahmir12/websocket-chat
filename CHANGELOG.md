# 📝 WebSocket Chat - Changelog

## [1.0.1] - 2025-02-14
- Fixed MongoDB connection issue by replacing `localhost` with `127.0.0.1`.
- Improved WebSocket heartbeat handling to prevent client disconnects.
- Wrapped WebSocket message handling in `try-catch` to prevent crashes.
- Cleaned up unnecessary MongoDB options (`useNewUrlParser` and `useUnifiedTopology`).
- Implemented secure WebSocket server using Node.js & Express.
- User authentication via JWT & MongoDB.
- Rate limiting to prevent spam.
- React frontend with WebSocket integration.
- Packaged as an executable (`server-win.exe` & `WebSocketChat.exe`).