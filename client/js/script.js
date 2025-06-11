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

    // 👥 Элементы управления профилем
    const profileModal = document.getElementById("profile-modal");
    const profileUsername = document.getElementById("profile-username");
    const profileEmail = document.getElementById("profile-email");
    const profilePassword = document.getElementById("profile-password");
    const profileAvatar = document.getElementById("profile-avatar");
    const avatarUpload = document.getElementById("avatar-upload");
    const saveBtn = document.getElementById("save-profile");
    const logoutBtn = document.getElementById("logout-btn");
    const profileMsg = document.getElementById("profile-message");
    const settingsBtn = document.getElementById("settings-btn");

    // 🖼️ Функция для обновления иконки пользователя
    function updateUserIcon(user) {
        const userIcon = document.getElementById("user-icon");
        const userAvatarIcon = document.getElementById("user-avatar-icon");
        const userInitial = document.getElementById("user-initial");

        if (user && user.avatar && user.avatar !== "https://via.placeholder.com/100") {
            userAvatarIcon.src = user.avatar;
            userAvatarIcon.style.display = "block";
            userInitial.style.display = "none";
            userIcon.style.padding = "0";
        } else if (user && user.username) {
            userAvatarIcon.style.display = "none";
            userInitial.style.display = "block";
            userInitial.textContent = user.username[0].toUpperCase();
            userIcon.style.padding = "10px 14px";
        } else {
            userAvatarIcon.style.display = "none";
            userInitial.style.display = "block";
            userInitial.textContent = "👤";
            userIcon.style.padding = "10px 14px";
        }
    }

    // 👤 Функция для обновления состояния пользователя
    function updateUserState() {
        const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));

        if (!currentUser) {
            // Пользователь не вошел в систему
            settingsBtn.style.display = "none";
            updateUserIcon(null);
        } else {
            // Пользователь вошел в систему
            settingsBtn.style.display = "block";
            updateUserIcon(currentUser);
        }
    }

    // ✅ Проверка состояния при загрузке страницы
    updateUserState();

    // ⚙️ Открытие модального окна профиля
    settingsBtn?.addEventListener("click", () => {
        const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!currentUser) return;

        profileModal.style.display = "flex";

        // Загружаем актуальные данные пользователя
        const savedUsers = JSON.parse(localStorage.getItem("users")) || [];
        const freshUser = savedUsers.find(u => u.email === currentUser.email) || currentUser;

        profileUsername.value = freshUser.username || "";
        profileEmail.value = freshUser.email || "";
        profilePassword.value = freshUser.password || "";
        profileAvatar.src = freshUser.avatar || "https://via.placeholder.com/100";

        // Очищаем сообщения
        profileMsg.textContent = "";
    });

    // 📤 Загрузка аватара
    avatarUpload?.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            profileMsg.textContent = "⚠️ File too large! Max 2MB.";
            profileMsg.style.color = "orange";
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            profileAvatar.src = reader.result;
            profileMsg.textContent = "📷 Image loaded! Don't forget to save.";
            profileMsg.style.color = "#1db954";
        };
        reader.readAsDataURL(file);
    });

    // 💾 Сохранение изменений профиля
    saveBtn?.addEventListener("click", () => {
        const currentUser = JSON.parse(localStorage.getItem("loggedInUser"));
        if (!currentUser) {
            profileMsg.textContent = "❌ User not logged in!";
            profileMsg.style.color = "red";
            return;
        }

        const updatedName = profileUsername.value.trim();
        const updatedEmail = profileEmail.value.trim();
        const updatedPass = profilePassword.value.trim();
        const updatedAvatar = profileAvatar.src;

        // Валидация данных
        if (!updatedName || !updatedEmail || !updatedPass) {
            profileMsg.textContent = "❌ Please fill in all fields!";
            profileMsg.style.color = "red";
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updatedEmail)) {
            profileMsg.textContent = "❌ Invalid email format!";
            profileMsg.style.color = "red";
            return;
        }

        const users = JSON.parse(localStorage.getItem("users")) || [];

        const emailExists = users.find(u => u.email === updatedEmail && u.email !== currentUser.email);
        if (emailExists) {
            profileMsg.textContent = "❌ Email already in use!";
            profileMsg.style.color = "red";
            return;
        }

        const userIndex = users.findIndex(u => u.email === currentUser.email);

        const updatedUser = {
            username: updatedName,
            email: updatedEmail,
            password: updatedPass,
            avatar: updatedAvatar
        };

        if (userIndex !== -1) {
            // Обновляем существующего пользователя
            users[userIndex] = updatedUser;
        } else {
            // Добавляем пользователя, если не найден
            users.push(updatedUser);
        }

        localStorage.setItem("users", JSON.stringify(users));
        localStorage.setItem("loggedInUser", JSON.stringify(updatedUser));

        // Обновляем иконку пользователя
        updateUserIcon(updatedUser);

        profileMsg.textContent = "✅ Profile updated successfully!";
        profileMsg.style.color = "#1db954";

        setTimeout(() => {
            profileModal.style.display = "none";
            profileMsg.textContent = "";
        }, 1500);
    });

    // 🔒 Выход из аккаунта
    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("loggedInUser");
        profileModal.style.display = "none";
        updateUserState(); // Обновляем состояние интерфейса
        profileMsg.textContent = "";
    });

    // ❌ Закрытие модального окна профиля
    document.getElementById("close-profile")?.addEventListener("click", () => {
        profileModal.style.display = "none";
        profileMsg.textContent = "";
    });

    // 🎭 Переключение dropdown меню
    document.getElementById("user-icon")?.addEventListener("click", () => {
        const dropdown = document.getElementById("dropdown");
        dropdown.style.display = dropdown.style.display === "block" ? "none" : "block";
    });

    // Закрытие dropdown при клике вне его
    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("dropdown");
        const userIcon = document.getElementById("user-icon");
        if (!userIcon.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });

    // 🔐 Модальное окно входа/регистрации
    const modal = document.getElementById("auth-modal");
    const toggleLink = document.getElementById("toggle-link");
    const authTitle = document.getElementById("auth-title");
    const authUsername = document.getElementById("auth-username");
    const authEmail = document.getElementById("auth-email");
    const authPassword = document.getElementById("auth-password");
    const authSubmit = document.getElementById("auth-submit");
    const authMessage = document.getElementById("auth-message");

    let isLoginMode = true;

    // Открытие модального окна входа
    document.getElementById("login-btn")?.addEventListener("click", () => {
        modal.style.display = "flex";
        authMessage.textContent = "";
    });

    // Закрытие модального окна входа
    document.getElementById("close-auth")?.addEventListener("click", () => {
        modal.style.display = "none";
        authMessage.textContent = "";
        // Очищаем поля
        authEmail.value = "";
        authPassword.value = "";
        authUsername.value = "";
    });

    // Переключение между входом и регистрацией
    toggleLink?.addEventListener("click", () => {
        isLoginMode = !isLoginMode;
        authTitle.textContent = isLoginMode ? "Login" : "Register";
        authSubmit.textContent = isLoginMode ? "Login" : "Register";
        authUsername.style.display = isLoginMode ? "none" : "block";
        toggleLink.textContent = isLoginMode ? "Register" : "Login";
        document.getElementById("auth-toggle").innerHTML = isLoginMode
            ? `Don't have an account? <span id="toggle-link">Register</span>`
            : `Already have an account? <span id="toggle-link">Login</span>`;
        authMessage.textContent = "";
    });

    // Обработка входа/регистрации
    authSubmit?.addEventListener("click", () => {
        const email = authEmail.value.trim();
        const pass = authPassword.value.trim();
        const username = authUsername.value.trim();
        const users = JSON.parse(localStorage.getItem("users") || "[]");

        // Валидация полей
        if (!email || !pass || (!isLoginMode && !username)) {
            authMessage.textContent = "❌ Please fill in all fields!";
            authMessage.style.color = "red";
            return;
        }

        // Проверка email формата
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            authMessage.textContent = "❌ Invalid email format!";
            authMessage.style.color = "red";
            return;
        }

        if (isLoginMode) {
            // Вход в систему
            const user = users.find(u => u.email === email && u.password === pass);
            if (user) {
                localStorage.setItem("loggedInUser", JSON.stringify(user));
                authMessage.textContent = `✅ Welcome back, ${user.username}!`;
                authMessage.style.color = "#1db954";

                setTimeout(() => {
                    modal.style.display = "none";
                    updateUserState(); // Обновляем состояние интерфейса
                    authMessage.textContent = "";
                    // Очищаем поля
                    authEmail.value = "";
                    authPassword.value = "";
                }, 1000);
            } else {
                authMessage.textContent = "❌ Invalid email or password!";
                authMessage.style.color = "red";
            }
        } else {
            // Регистрация
            if (users.find(u => u.email === email)) {
                authMessage.textContent = "❌ User with this email already exists!";
                authMessage.style.color = "red";
            } else {
                const newUser = {
                    username,
                    email,
                    password: pass,
                    avatar: null
                };
                users.push(newUser);
                localStorage.setItem("users", JSON.stringify(users));
                localStorage.setItem("loggedInUser", JSON.stringify(newUser));

                authMessage.textContent = `✅ Welcome, ${username}! Account created successfully!`;
                authMessage.style.color = "#1db954";

                setTimeout(() => {
                    modal.style.display = "none";
                    updateUserState(); // Обновляем состояние интерфейса
                    authMessage.textContent = "";
                    // Очищаем поля
                    authEmail.value = "";
                    authPassword.value = "";
                    authUsername.value = "";
                }, 1000);
            }
        }
    });

    // Остальной код для Spotify остается без изменений...

    // 🔗 Подключение к Spotify
    document.getElementById("connect-btn")?.addEventListener("click", () => {
        window.location.href = "/login";
    });

    // 🔍 Поиск
    document.getElementById('open-search')?.addEventListener('click', () => {
        document.getElementById('search-overlay').style.display = 'flex';
    });

    document.getElementById('close-search')?.addEventListener('click', () => {
        document.getElementById('search-overlay').style.display = 'none';
        document.getElementById('search-query').value = '';
        document.getElementById('search-results').innerHTML = '';
    });

    // Здесь должен быть весь остальной код для Spotify функциональности
    // (плейлисты, треки, плеер и т.д.)

    const playlistsDiv = document.getElementById("playlists");
    const tracksDiv = document.getElementById("tracks");

    // Загрузка плейлистов пользователя
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

    // Остальной код Spotify плеера...
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

            setInterval(() => {
                if (playerInstance) {
                    playerInstance.getCurrentState().then(state => {
                        if (state) {
                            const pos = state.position / 1000;
                            const dur = state.duration / 1000;
                            const percent = (pos / dur) * 100;

                            document.getElementById('progress-bar').value = pos;
                            document.getElementById('current-time').textContent = formatTime(pos);
                            document.getElementById('duration').textContent = formatTime(dur);

                            document.getElementById('progress-bar').style.background = `linear-gradient(to right, #1db954 ${percent}%, #444 ${percent}%)`;
                        }
                    });
                }
            }, 1000);
        });

        player.addListener('player_state_changed', state => {
            if (state) {
                const track = state.track_window.current_track;
                document.getElementById('track-image').src = track.album.images[0].url;
                document.getElementById('track-name').innerText = track.name;
                document.getElementById('track-artist').innerText = track.artists.map(a => a.name).join(', ');

                const durationSec = state.duration / 1000;
                const positionSec = state.position / 1000;

                document.getElementById('progress-bar').max = durationSec;
                document.getElementById('progress-bar').value = positionSec;
                document.getElementById('current-time').textContent = formatTime(positionSec);
                document.getElementById('duration').textContent = formatTime(durationSec);
            }
        });
        player.connect();
    };

    function formatTime(sec) {
        const minutes = Math.floor(sec / 60);
        const seconds = Math.floor(sec % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

    // Поиск треков
    document.getElementById('search-button')?.addEventListener('click', () => {
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

    // Управление плеером
    document.getElementById('play')?.addEventListener('click', () => {
        if (playerInstance) playerInstance.resume();
    });

    document.getElementById('pause')?.addEventListener('click', () => {
        if (playerInstance) playerInstance.pause();
    });

    document.getElementById('next')?.addEventListener('click', () => {
        if (playerInstance) playerInstance.nextTrack();
    });

    document.getElementById('prev')?.addEventListener('click', () => {
        if (playerInstance) playerInstance.previousTrack();
    });

    document.getElementById('volume')?.addEventListener('input', (e) => {
        if (playerInstance) {
            const volumeValue = e.target.value / 100;
            playerInstance.setVolume(volumeValue).then(() => {
                console.log(`Volume set to ${volumeValue}`);
            });
        }
    });

    document.getElementById('progress-bar')?.addEventListener('input', (e) => {
        const seekPos = parseFloat(e.target.value);
        if (playerInstance) {
            playerInstance.seek(seekPos * 1000);
        }
    });
});