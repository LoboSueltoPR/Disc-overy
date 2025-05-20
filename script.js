// Configuración de la API de Spotify
const clientId = 'e9485e0160964d3dbf9eac4cd36239be';
const redirectUri = encodeURIComponent('https://lobosueltopr.github.io/Disc-overy/');
const scopes = encodeURIComponent('user-top-read user-read-private user-read-email');

// Elementos del DOM
const loginBtn = document.getElementById('login-btn');
const generateBtn = document.getElementById('generate-btn');
const loginSection = document.getElementById('login-section');
const appSection = document.getElementById('app-section');
const userInfo = document.getElementById('user-info');
const userAvatar = document.getElementById('user-avatar');
const userName = document.getElementById('user-name');
const resultSection = document.getElementById('result');
const albumCover = document.getElementById('album-cover');
const albumName = document.getElementById('album-name');
const artistName = document.getElementById('artist-name');
const albumYear = document.getElementById('album-year');
const spotifyLink = document.getElementById('spotify-link');
const loadingSection = document.getElementById('loading');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Autenticación con Spotify
loginBtn.addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=token&show_dialog=true`;
    console.log('Redirigiendo a:', authUrl);
    window.location.href = authUrl;
});

// Verificar estado de autenticación
function checkAuthStatus() {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');

    if (accessToken) {
        // Limpiar el hash de la URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        getUserProfile(accessToken);
    } else if (localStorage.getItem('spotifyAccessToken')) {
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        getUserProfile(localStorage.getItem('spotifyAccessToken'));
    }
}

// Obtener perfil del usuario
async function getUserProfile(accessToken) {
    try {
        const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el perfil del usuario');
        }
        
        const data = await response.json();
        displayUserInfo(data);
        localStorage.setItem('spotifyAccessToken', accessToken);
    } catch (error) {
        console.error('Error:', error);
        localStorage.removeItem('spotifyAccessToken');
        alert('Hubo un error al obtener tu perfil. Por favor, inicia sesión nuevamente.');
    }
}

// Mostrar información del usuario
function displayUserInfo(userData) {
    if (userData.images?.[0]?.url) {
        userAvatar.src = userData.images[0].url;
    } else {
        userAvatar.src = 'https://i.scdn.co/image/ab6775700000ee8518a0a6f0a53b2a7a1ba0d9e8'; // Avatar por defecto
    }
    userName.textContent = userData.display_name || userData.id;
    userInfo.classList.remove('hidden');
}

// Obtener álbum aleatorio basado en gustos
async function getRandomAlbumBasedOnTaste() {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) throw new Error('No hay token de acceso');
    
    // 1. Obtener artistas top
    const topArtists = await getTopArtists(accessToken);
    if (!topArtists.length) throw new Error('No se encontraron artistas');
    
    // 2. Seleccionar artista aleatorio
    const randomArtist = getRandomItem(topArtists);
    
    // 3. Obtener álbumes del artista
    const artistAlbums = await getArtistAlbums(accessToken, randomArtist.id);
    if (!artistAlbums.length) throw new Error('El artista no tiene álbumes');
    
    // 4. Seleccionar álbum aleatorio
    const randomAlbum = getRandomItem(artistAlbums);
    
    // 5. Obtener detalles del álbum
    return await getAlbumDetails(accessToken, randomAlbum.id);
}

// Funciones auxiliares para la API
async function getTopArtists(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error('Error al obtener artistas top');
    const data = await response.json();
    return data.items;
}

async function getArtistAlbums(accessToken, artistId) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=50`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error('Error al obtener álbumes del artista');
    const data = await response.json();
    return data.items;
}

async function getAlbumDetails(accessToken, albumId) {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error('Error al obtener detalles del álbum');
    return await response.json();
}

// Mostrar álbum en la interfaz
function displayAlbum(album) {
    albumCover.src = album.images[0].url;
    albumName.textContent = album.name;
    artistName.textContent = album.artists.map(artist => artist.name).join(', ');
    albumYear.textContent = new Date(album.release_date).getFullYear();
    spotifyLink.href = album.external_urls.spotify;
    resultSection.classList.remove('hidden');
}

// Utilidades
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

function showLoading() {
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
}

function hideLoading() {
    loadingSection.classList.add('hidden');
}