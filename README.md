# Spotify Ready Project

## Setup Instructions

1. Go to /server folder.
2. Create `.env` file with:
```
CLIENT_ID=9f8edd29c7d742e7b2f93dc20f548f67
CLIENT_SECRET=YOUR_SPOTIFY_CLIENT_SECRET
REDIRECT_URI=http://127.0.0.1:8888/callback
```
3. Install dependencies:
```
npm install express request cors dotenv
```
4. Start the server:
```
node server.js
```
5. Open your browser:
```
http://127.0.0.1:8888
```
6. Click **Connect Spotify** → authorize → enjoy! 🎧
