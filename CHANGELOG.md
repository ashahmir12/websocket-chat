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


## [v1.2] - 2025-03-23
### Added
- Implemented user selection window in the frontend to allow private chat switching between users.
- Added dynamic user list broadcasting from the backend using WebSocket after authentication and disconnection.
- Built a chat logging system: each private session between two users is stored in a `.txt` log file within the `/logs` folder.
- Messages are logged with timestamps and sender/receiver tags.
- Introduced `selectedUser` feature in frontend for targeted messaging.
- Integrated emoji support in the frontend using `emoji-picker-react` (v3.5.1) with no external CSS requirement.
- Added emoji picker toggle button and emoji insertion into the message input field.
- Implemented rich text formatting in chat messages using simple markdown-like syntax:
  - `**bold**` → **bold**
  - `_italic_` → _italic_
  - `[link](https://example.com)` → clickable link
- Introduced a markdown-to-HTML converter in the frontend before sending messages.
- Added support for cross-device chat via LAN IP — prepped frontend to connect using the host machine’s IP (for iPhone/local device use).
- Styled the chat input section for emoji and send buttons to fit smaller screens (mobile-friendly improvements).

### Fixed
- Fixed issue where users wouldn’t appear in the dropdown after login on other devices.
- Resolved bug causing message broadcasts to reach unintended users.
- Fixed WebSocket reconnection loop issue on client-side.
- Fixed duplicate messages issue where sender saw two copies (now relies solely on server echo).
- Fixed emoji insertion bug where `undefined` was appearing in the input field (corrected to use `emojiObject.emoji`).
- Fixed emoji picker crash caused by incompatible `emoji-mart` version (switched to `emoji-picker-react`).
- Resolved runtime error caused by incorrect `onEmojiClick` argument structure.

### Changed
- Updated server message handling logic to route messages only between sender and recipient.
- Reorganized WebSocket server-side logic to avoid duplicated `message` event handling.
- Refined frontend state management to reset messages on user switch.
- Replaced `emoji-mart` with `emoji-picker-react` for stability and compatibility with Create React App.
- Updated frontend `App.js` to handle proper emoji selection and formatting.
- Cleaned up emoji picker toggling logic and placement in the UI.
- Improved client UX by auto-closing the emoji picker after selection.


