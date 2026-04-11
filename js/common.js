// Общие функции и конфигурация

const WEATHER_BG_MAP = {
    clear: 'img/clear.jpg',
    partly_cloudy: 'img/partly-cloudy.jpg',
    cloudy: 'img/cloudy.jpg',
    fog: 'img/fog.jpg',
    rain: 'img/rain.jpg',
    snow: 'img/snow.jpg',
    thunderstorm: 'img/thunderstorm.jpg',
    default: 'img/default.jpg'
};

// API через Cloudflare Worker
const API_BASE_URL = 'https://vpn.matvey-gadackiy2011.workers.dev';

// Тема
let currentTheme = localStorage.getItem('theme') || 'dark';

function getWeatherCategory(code) {
    if (code === 0) return 'clear';
    if (code === 1 || code === 2) return 'partly_cloudy';
    if (code === 3) return 'cloudy';
    if (code >= 45 && code <= 48) return 'fog';
    if (code >= 51 && code <= 67) return 'rain';
    if (code >= 71 && code <= 77) return 'snow';
    if (code >= 80 && code <= 82) return 'rain';
    if (code >= 85 && code <= 86) return 'snow';
    if (code >= 95) return 'thunderstorm';
    return 'default';
}

function getWeatherDescription(code) {
    const map = {
        0: 'Ясно', 1: 'Преимущественно ясно', 2: 'Переменная облачность',
        3: 'Пасмурно', 45: 'Туман', 48: 'Изморозь',
        51: 'Лёгкая морось', 53: 'Морось', 55: 'Сильная морось',
        61: 'Небольшой дождь', 63: 'Дождь', 65: 'Сильный дождь',
        71: 'Небольшой снег', 73: 'Снег', 75: 'Сильный снег',
        80: 'Ливень', 81: 'Сильный ливень', 82: 'Очень сильный ливень',
        85: 'Снегопад', 86: 'Сильный снегопад',
        95: 'Гроза', 96: 'Гроза с градом', 99: 'Сильная гроза'
    };
    return map[code] || 'Неизвестно';
}

function getWeatherEmoji(code) {
    const map = {
        0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
        45: '🌫️', 48: '🌫️',
        51: '🌦️', 53: '🌦️', 55: '🌧️',
        61: '🌧️', 63: '🌧️', 65: '🌧️',
        71: '🌨️', 73: '🌨️', 75: '❄️',
        80: '🌦️', 81: '🌧️', 82: '🌧️',
        85: '🌨️', 86: '❄️',
        95: '⛈️', 96: '⛈️', 99: '⛈️'
    };
    return map[code] || '🌡️';
}

function getWindDirection(deg) {
    const directions = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
    return directions[Math.round(deg / 45) % 8];
}

function updateBackground(code) {
    const bgLayer = document.getElementById('bgLayer');
    if (!bgLayer) return;
    
    const category = getWeatherCategory(code);
    const imageUrl = WEATHER_BG_MAP[category] || WEATHER_BG_MAP.default;
    
    if (imageUrl) {
        bgLayer.style.backgroundImage = `url('${imageUrl}')`;
    } else {
        const fallbackColors = {
            clear: 'linear-gradient(145deg, #4facfe 0%, #00f2fe 100%)',
            partly_cloudy: 'linear-gradient(145deg, #6b8cce 0%, #b8c6db 100%)',
            cloudy: 'linear-gradient(145deg, #5f6c7a 0%, #919ba7 100%)',
            fog: 'linear-gradient(145deg, #b0bec5 0%, #cfd8dc 100%)',
            rain: 'linear-gradient(145deg, #3a4e6b 0%, #5f7a9f 100%)',
            snow: 'linear-gradient(145deg, #e0eaf5 0%, #b0c4de 100%)',
            thunderstorm: 'linear-gradient(145deg, #2c3e50 0%, #4a6274 100%)',
            default: 'linear-gradient(145deg, #2b5876 0%, #4e4376 100%)'
        };
        bgLayer.style.backgroundImage = fallbackColors[category] || fallbackColors.default;
    }
}

async function requestLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Геолокация не поддерживается'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => {
                let msg = 'Не удалось получить геолокацию.';
                if (err.code === 1) msg = 'Доступ к геолокации запрещён.';
                else if (err.code === 2) msg = 'Местоположение недоступно.';
                else if (err.code === 3) msg = 'Истекло время ожидания.';
                reject(new Error(msg));
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 600000 }
        );
    });
}

async function reverseGeocode(lat, lon) {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=ru`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка геокодирования');
        const data = await response.json();
        
        const address = data.address || {};
        const city = address.city || address.town || address.village || address.municipality || '';
        const state = address.state || address.region || '';
        const country = address.country || '';
        
        return {
            main: city || address.county || 'Неизвестный пункт',
            region: [state, country].filter(Boolean).join(', '),
            fullDisplay: data.display_name || `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
        };
    } catch (e) {
        console.warn('Ошибка геокодирования:', e);
        return {
            main: 'Местоположение',
            region: '',
            fullDisplay: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
        };
    }
}

async function fetchWeatherData(lat, lon, endpoint = 'dwd-icon') {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,uv_index,surface_pressure,precipitation,wind_gusts_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,sunrise,sunset',
        timezone: 'auto',
        forecast_days: 7
    });

    const url = `${API_BASE_URL}/${endpoint}?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Ошибка API: ${response.status}`);
    return await response.json();
}

function hPaToMmHg(hPa) {
    return Math.round(hPa * 0.75006);
}

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

function getCurrentTimeString() {
    const now = new Date();
    return now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Инициализация темы
function initTheme() {
    if (currentTheme === 'light') {
        document.body.classList.add('light-theme');
    } else {
        document.body.classList.remove('light-theme');
    }
}

// Переключение темы
function toggleTheme() {
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', currentTheme);
    
    // Применяем тему на всех открытых страницах (если есть)
    document.body.classList.toggle('light-theme', currentTheme === 'light');
    
    // Отправляем событие для синхронизации между вкладками
    localStorage.setItem('theme_sync', Date.now());
    
    updateThemeMenu();
}

// Обновление меню темы
function updateThemeMenu() {
    const themeItems = document.querySelectorAll('.menu-item[data-theme]');
    themeItems.forEach(item => {
        if (item.dataset.theme === currentTheme) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

// Инициализация меню
function initMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (!menuBtn || !menuDropdown) return;
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
    });
    
    document.addEventListener('click', () => {
        menuDropdown.classList.remove('show');
    });
    
    menuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Обработчики темы
    const themeItems = document.querySelectorAll('.menu-item[data-theme]');
    themeItems.forEach(item => {
        item.addEventListener('click', () => {
            const theme = item.dataset.theme;
            if (theme !== currentTheme) {
                toggleTheme();
            }
            menuDropdown.classList.remove('show');
        });
    });
    
    updateThemeMenu();
}

// Слушаем изменения темы из других вкладок
window.addEventListener('storage', (e) => {
    if (e.key === 'theme') {
        currentTheme = e.newValue || 'dark';
        document.body.classList.toggle('light-theme', currentTheme === 'light');
        updateThemeMenu();
    }
});

// Экспорт
window.initTheme = initTheme;
window.initMenu = initMenu;
window.toggleTheme = toggleTheme;