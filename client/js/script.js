document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("access_token");
    if (token) {
        localStorage.setItem("spotifyAccessToken", token);
    }

    const savedToken = localStorage.getItem("spotifyAccessToken");
    if (!savedToken) {
        console.error("No Spotify token found!");
        return;
    }

    const playlistsDiv = document.getElementById("playlists");
    const tracksDiv = document.getElementById("tracks");


    fetch("https://api.spotify.com/v1/me/playlists", {
        headers: { Authorization: "Bearer " + savedToken }
    })
        .then(res => res.json())
        .then(data => {
            if (data.items) {
                playlistsDiv.innerHTML = '<h2>Your Playlists</h2>';
                data.items.forEach(pl => {
                    const div = document.createElement("div");
                    div.style.marginBottom = '10px';
                    div.innerHTML = `
                        <a href="#" data-id="${pl.id}">
                            <img src="${pl.images[0] ? pl.images[0].url : ''}" width="100" /><br>
                            <small>${pl.name}</small>
                        </a>
                    `;
                    playlistsDiv.appendChild(div);
                });
                attachPlaylistClickHandlers();
            } else {
                playlistsDiv.innerText = "No playlists found or token expired.";
            }
        });

    function attachPlaylistClickHandlers() {
        document.querySelectorAll('#playlists a[data-id]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const playlistId = e.currentTarget.getAttribute('data-id');
                showPlaylistTracks(playlistId);
            });
        });
    }

    function showPlaylistTracks(playlistId) {
        fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
            headers: {
                'Authorization': `Bearer ${savedToken}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const result = document.getElementById('tracks');
                result.innerHTML = `<h2>Tracks in Playlist</h2>`;

                data.items.forEach(item => {
                    const track = item.track;
                    const trackDiv = document.createElement('div');
                    trackDiv.className = 'track-item';
                    trackDiv.style.display = 'flex';
                    trackDiv.style.alignItems = 'center';
                    trackDiv.style.cursor = 'pointer';
                    trackDiv.style.padding = '5px';
                    trackDiv.style.marginBottom = '6px';
                    trackDiv.style.borderBottom = '1px solid #333';

                    trackDiv.innerHTML = `
                <img src="${track.album.images[2] ? track.album.images[2].url : ''}" width="40" height="40" style="margin-right: 10px; border-radius: 4px;" />
                <div>
                    <strong>${track.name}</strong><br>
                    <small>${track.artists.map(a => a.name).join(', ')}</small>
                </div>
            `;

                    trackDiv.addEventListener('click', () => {
                        playTrackInContext(`spotify:playlist:${playlistId}`, track.uri);
                    });

                    result.appendChild(trackDiv);
                });
            });
    }


    let deviceId = null;
    let playerInstance = null;

    window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new Spotify.Player({
            name: 'Web Player Clone',
            getOAuthToken: cb => { cb(savedToken); },
            volume: 0.5
        });

        playerInstance = player;

        player.addListener('ready', ({ device_id }) => {
            console.log('Player ready with Device ID', device_id);
            deviceId = device_id;

            fetch('https://api.spotify.com/v1/me/player', {
                method: 'PUT',
                body: JSON.stringify({ device_ids: [device_id], play: false }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${savedToken}`
                }
            });
        });

        player.addListener('player_state_changed', state => {
            if (state) {
                const track = state.track_window.current_track;
                document.getElementById('track-image').src = track.album.images[0].url;
                document.getElementById('track-name').innerText = track.name;
                document.getElementById('track-artist').innerText = track.artists.map(a => a.name).join(', ');
            }
        });

        player.connect();
    };

    function playTrack(trackUri) {
        if (!deviceId) {
            console.error("Device not ready yet!");
            return;
        }

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [trackUri] }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}`
            }
        }).then(res => {
            if (res.status === 204) {
                console.log("Playing track:", trackUri);
            } else {
                res.json().then(data => console.error("Error playing track:", data));
            }
        });
    }

    function playTrackInContext(playlistUri, trackUri) {
        if (!playerInstance || !deviceId) {
            console.warn("Player not ready yet!");
            alert("Player not ready yet! Wait for it to connect or check Spotify device.");
            return;
        }

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({
                context_uri: playlistUri,
                offset: { uri: trackUri }
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}`
            }
        }).then(res => {
            if (res.status === 204) {
                console.log("✅ Playing track in context:", trackUri);
            } else {
                res.json().then(data => {
                    console.error("❌ Error playing track in context:", data);
                    alert("Failed to play track. Check console for details.");
                });
            }
        });
    }
    document.getElementById('search-button').addEventListener('click', () => {
        const query = document.getElementById('search-query').value.trim();
        if (query) {
            searchTracks(query);
        }
    });

    function searchTracks(query) {
        fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=20`, {
            headers: {
                'Authorization': `Bearer ${savedToken}`
            }
        })
            .then(res => res.json())
            .then(data => {
                const container = document.getElementById('search-results');
                container.innerHTML = '<h3>Search Results</h3>';

                data.tracks.items.forEach(track => {
                    const div = document.createElement('div');
                    div.className = 'track-item';
                    div.style.display = 'flex';
                    div.style.alignItems = 'center';
                    div.style.cursor = 'pointer';
                    div.style.padding = '5px';
                    div.style.marginBottom = '6px';
                    div.style.borderBottom = '1px solid #333';

                    div.innerHTML = `
                <img src="${track.album.images[2] ? track.album.images[2].url : ''}" width="40" height="40" style="margin-right: 10px; border-radius: 4px;" />
                <div>
                    <strong>${track.name}</strong><br>
                    <small>${track.artists.map(a => a.name).join(', ')}</small>
                </div>
            `;

                    div.addEventListener('click', () => {
                        playDirectTrack(track.uri);
                    });

                    container.appendChild(div);
                });
            });
    }

    function playDirectTrack(trackUri) {
        if (!playerInstance || !deviceId) {
            console.warn("Player not ready yet!");
            alert("Player not ready yet! Wait for it to connect or check Spotify device.");
            return;
        }

        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({
                uris: [trackUri]
            }),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}`
            }
        }).then(res => {
            if (res.status === 204) {
                console.log("✅ Playing direct track:", trackUri);
            } else {
                res.json().then(data => {
                    console.error("❌ Error playing direct track:", data);
                    alert("Failed to play track. Check console for details.");
                });
            }
        });
    }



    document.getElementById('play').addEventListener('click', () => {
        if (playerInstance) playerInstance.resume();
    });

    document.getElementById('pause').addEventListener('click', () => {
        if (playerInstance) playerInstance.pause();
    });

    document.getElementById('next').addEventListener('click', () => {
        if (playerInstance) playerInstance.nextTrack();
    });

    document.getElementById('prev').addEventListener('click', () => {
        if (playerInstance) playerInstance.previousTrack();
    });

    document.getElementById('volume').addEventListener('input', (e) => {
        if (playerInstance) {
            const volumeValue = e.target.value / 100;
            playerInstance.setVolume(volumeValue).then(() => {
                console.log(`Volume set to ${volumeValue}`);
            });
        }
    });
});