
const express = require('express');
const request = require('request');
const cors = require('cors');
const querystring = require('querystring');
const path = require('path');
require('dotenv').config();

console.log("Loaded CLIENT_ID:", process.env.CLIENT_ID);
console.log("Loaded CLIENT_SECRET:", process.env.CLIENT_SECRET);
console.log("Loaded REDIRECT_URI:", process.env.REDIRECT_URI);

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, '../client')));

const redirect_uri = process.env.REDIRECT_URI;
const client_id = process.env.CLIENT_ID;
const client_secret = process.env.CLIENT_SECRET;

app.get('/login', (req, res) => {
  const scope = 'streaming user-read-private user-read-email playlist-read-private user-modify-playback-state';
  const auth_query = querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
  });
  console.log("Redirecting to Spotify:", auth_query);
  res.redirect('https://accounts.spotify.com/authorize?' + auth_query);
});


app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  console.log("Received callback with code:", code);
  if (!code) {
    return res.send('No code received from Spotify.');
  }
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    json: true
  };
  request.post(authOptions, (error, response, body) => {
    if (!error && response.statusCode === 200) {
      const access_token = body.access_token;
      res.redirect('/?access_token=' + access_token);
    } else {
      console.log("Spotify auth failed:", body);
      res.send('Spotify auth failed: ' + JSON.stringify(body));
    }
  });
});

app.listen(8888, () => {
  console.log('✅ Server started on http://127.0.0.1:8888');
});
