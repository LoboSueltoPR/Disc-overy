// Configuración de la API de Spotify
const clientId = 'e9485e0160964d3dbf9eac4cd36239be'; // Reemplaza con tu Client ID de Spotify
const redirectUri = 'https://lobosueltopr.github.io/Disc-overy/'; 
const scopes = 'user-top-read user-read-private user-read-email';

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

// Manejar el login con Spotify
loginBtn.addEventListener('click', () => {
    const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scopes)}&response_type=token&show_dialog=true`;
    window.location.href = authUrl;
});

// Manejar la generación de un álbum aleatorio
generateBtn.addEventListener('click', async () => {
    try {
        showLoading();
        const album = await getRandomAlbumBasedOnTaste();
        displayAlbum(album);
    } catch (error) {
        console.error('Error al obtener el álbum:', error);
        alert('Hubo un error al obtener el álbum. Por favor, intenta nuevamente.');
    } finally {
        hideLoading();
    }
});
// Modifica la función checkAuthStatus
function checkAuthStatus() {
    // Para GitHub Pages, necesitamos manejar el hash de forma diferente
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get('access_token');
        
        if (accessToken) {
            // Limpiar el hash sin recargar la página
            window.history.replaceState({}, document.title, window.location.pathname);
            
            loginSection.classList.add('hidden');
            appSection.classList.remove('hidden');
            getUserProfile(accessToken);
        }
    } else if (localStorage.getItem('spotifyAccessToken')) {
        // Si ya hay un token almacenado (después de refrescar la página)
        loginSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        getUserProfile(localStorage.getItem('spotifyAccessToken'));
    }
}

// Obtener el perfil del usuario
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
        
        // Guardar el token de acceso para usarlo más tarde
        localStorage.setItem('spotifyAccessToken', accessToken);
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al obtener tu perfil. Por favor, intenta iniciar sesión nuevamente.');
    }
}

// Mostrar información del usuario
function displayUserInfo(userData) {
    userAvatar.src = userData.images?.[0]?.url || 'assets/default-avatar.png';
    userName.textContent = userData.display_name || userData.id;
    userInfo.classList.remove('hidden');
}

// Obtener un álbum aleatorio basado en los gustos del usuario
async function getRandomAlbumBasedOnTaste() {
    const accessToken = localStorage.getItem('spotifyAccessToken');
    if (!accessToken) {
        throw new Error('No se encontró el token de acceso');
    }
    
    // Paso 1: Obtener los artistas top del usuario
    const topArtists = await getTopArtists(accessToken);
    
    // Paso 2: Seleccionar un artista aleatorio
    const randomArtist = getRandomItem(topArtists);
    
    // Paso 3: Obtener los álbumes del artista
    const artistAlbums = await getArtistAlbums(accessToken, randomArtist.id);
    
    // Paso 4: Seleccionar un álbum aleatorio
    const randomAlbum = getRandomItem(artistAlbums);
    
    // Paso 5: Obtener información detallada del álbum
    const albumDetails = await getAlbumDetails(accessToken, randomAlbum.id);
    
    return albumDetails;
}

// Obtener los artistas top del usuario
async function getTopArtists(accessToken) {
    const response = await fetch('https://api.spotify.com/v1/me/top/artists?limit=50&time_range=medium_term', {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al obtener artistas top');
    }
    
    const data = await response.json();
    return data.items;
}

// Obtener los álbumes de un artista
async function getArtistAlbums(accessToken, artistId) {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=50`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al obtener álbumes del artista');
    }
    
    const data = await response.json();
    return data.items;
}

// Obtener detalles de un álbum
async function getAlbumDetails(accessToken, albumId) {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    });
    
    if (!response.ok) {
        throw new Error('Error al obtener detalles del álbum');
    }
    
    const data = await response.json();
    return data;
}

// Mostrar el álbum en la interfaz
function displayAlbum(album) {
    albumCover.src = album.images[0].url;
    albumName.textContent = album.name;
    artistName.textContent = album.artists.map(artist => artist.name).join(', ');
    albumYear.textContent = new Date(album.release_date).getFullYear();
    spotifyLink.href = album.external_urls.spotify;
    
    resultSection.classList.remove('hidden');
}

// Función auxiliar para obtener un elemento aleatorio de un array
function getRandomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// Mostrar estado de carga
function showLoading() {
    loadingSection.classList.remove('hidden');
    resultSection.classList.add('hidden');
}

// Ocultar estado de carga
function hideLoading() {
    loadingSection.classList.add('hidden');
}