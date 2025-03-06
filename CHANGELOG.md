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


## [Unreleased]

## [v1.1] - 2025-03-05
### Added
- Added `cross-env` to ensure HTTPS works properly on Windows.
- Fixed CORS policy errors preventing frontend requests.
- Updated WebSocket handling for reconnect and authentication.
- Explicitly set HTTPS for frontend and backend.
- Fixed GitHub repository structure by adding frontend as a tracked directory.

### Fixed
- Fixed CORS issues between `localhost:3000` and `localhost`.
- Fixed HTTPS environment setup for Windows.
- Resolved issues with missing `.gitignore` preventing large files from being committed.

### Changed
- Updated `package.json` scripts to support HTTPS.
- Moved `bcryptjs` to `bcrypt` for better compatibility.
