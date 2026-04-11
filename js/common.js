// Общие функции

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

const API_URLS = [
    'https://api.open-meteo.com/v1/dwd-icon',
    'https://vpn.matvey-gadackiy2011.workers.dev/v1/dwd-icon'
];

let currentTheme = localStorage.getItem('theme') || 'light';
let emojiSet = localStorage.getItem('emojiSet') || 'system';

// SVG-эмодзи
const FLUENT_SVG_MAP = {
    0: 'Sun.svg',
    1: 'Sun behind small cloud.svg',
    2: 'Sun behind cloud.svg',
    3: 'Cloud.svg',
    45: 'Fog.svg', 48: 'Fog.svg',
    51: 'Cloud with rain.svg', 53: 'Cloud with rain.svg', 55: 'Cloud with rain.svg',
    61: 'Sun behind rain cloud.svg', 63: 'Cloud with rain.svg', 65: 'Cloud with rain.svg',
    71: 'Cloud with snow.svg', 73: 'Cloud with snow.svg', 75: 'Cloud with snow.svg',
    80: 'Cloud with rain.svg', 81: 'Cloud with rain.svg', 82: 'Cloud with rain.svg',
    85: 'Cloud with snow.svg', 86: 'Cloud with snow.svg',
    95: 'Cloud with lightning.svg', 96: 'Cloud with lightning and rain.svg', 99: 'Cloud with lightning and rain.svg'
};

const SYSTEM_EMOJIS = {
    0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️',
    45: '🌫️', 48: '🌫️',
    51: '🌦️', 53: '🌧️', 55: '🌧️',
    61: '🌧️', 63: '🌧️', 65: '🌧️',
    71: '🌨️', 73: '🌨️', 75: '❄️',
    80: '🌦️', 81: '🌧️', 82: '🌧️',
    85: '❄️', 86: '❄️',
    95: '⛈️', 96: '⛈️', 99: '⛈️'
};

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
        51: 'Морось', 53: 'Морось', 55: 'Морось',
        61: 'Дождь', 63: 'Дождь', 65: 'Дождь',
        71: 'Снег', 73: 'Снег', 75: 'Снег',
        80: 'Ливень', 81: 'Ливень', 82: 'Ливень',
        85: 'Снегопад', 86: 'Снегопад',
        95: 'Гроза', 96: 'Гроза', 99: 'Гроза'
    };
    return map[code] || 'Неизвестно';
}

function getWeatherEmojiHtml(code) {
    if (emojiSet === 'fluent') {
        const svgFile = FLUENT_SVG_MAP[code] || 'Cloud.svg';
        return `<img src="emoji/${svgFile}" alt="" style="width:100%;height:100%;">`;
    } else {
        return SYSTEM_EMOJIS[code] || '🌡️';
    }
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
    
    const fallbackColors = {
        clear: '#4facfe',
        partly_cloudy: '#6b8cce',
        cloudy: '#5f6c7a',
        fog: '#b0bec5',
        rain: '#3a4e6b',
        snow: '#e0eaf5',
        thunderstorm: '#2c3e50',
        default: '#2b5876'
    };
    
    bgLayer.style.backgroundImage = `url('${imageUrl}')`;
    
    const img = new Image();
    img.onerror = () => {
        bgLayer.style.backgroundImage = `linear-gradient(145deg, ${fallbackColors[category]}, ${fallbackColors[category]}dd)`;
    };
    img.src = imageUrl;
}

async function requestLocation() {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Геолокация не поддерживается'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            (err) => reject(new Error('Не удалось получить геолокацию')),
            { enableHighAccuracy: false, timeout: 10000 }
        );
    });
}

async function reverseGeocode(lat, lon) {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=ru`;
        const response = await fetch(url);
        const data = await response.json();
        const address = data.address || {};
        const city = address.city || address.town || address.village || '';
        const state = address.state || '';
        
        return {
            main: city || 'Неизвестный пункт',
            region: state,
            fullDisplay: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`
        };
    } catch (e) {
        return { main: 'Местоположение', region: '', fullDisplay: `${lat.toFixed(4)}°, ${lon.toFixed(4)}°` };
    }
}

async function fetchWeatherData(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat, longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,surface_pressure,precipitation,wind_gusts_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
        hourly: 'temperature_2m,weather_code',
        timezone: 'auto', forecast_days: 7
    });

    for (const baseUrl of API_URLS) {
        try {
            const response = await fetch(`${baseUrl}?${params.toString()}`);
            if (response.ok) return await response.json();
        } catch (e) {}
    }
    throw new Error('API недоступен');
}

function hPaToMmHg(hPa) { return Math.round(hPa * 0.75006); }
function formatTime(iso) { return new Date(iso).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }
function getCurrentTimeString() { return new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }); }

function initTheme() {
    document.body.classList.toggle('dark-theme', currentTheme === 'dark');
    document.body.classList.toggle('light-theme', currentTheme === 'light');
}

function setEmojiSet(set) {
    emojiSet = set;
    localStorage.setItem('emojiSet', set);
    updateMenuUI();
    if (typeof loadWeatherData === 'function') loadWeatherData();
}

function updateMenuUI() {
    document.querySelectorAll('[data-theme]').forEach(i => i.classList.toggle('active', i.dataset.theme === currentTheme));
    document.querySelectorAll('[data-emoji]').forEach(i => i.classList.toggle('active', i.dataset.emoji === emojiSet));
}

function initMenu() {
    const btn = document.getElementById('menuBtn');
    const dd = document.getElementById('menuDropdown');
    if (!btn || !dd) return;
    
    btn.onclick = (e) => { e.stopPropagation(); dd.classList.toggle('show'); };
    document.onclick = () => dd.classList.remove('show');
    dd.onclick = (e) => e.stopPropagation();
    
    document.querySelectorAll('.menu-section-title').forEach(t => {
        t.onclick = () => t.closest('.menu-section').classList.toggle('expanded');
    });
    
    document.querySelectorAll('[data-theme]').forEach(i => {
        i.onclick = () => {
            currentTheme = i.dataset.theme;
            localStorage.setItem('theme', currentTheme);
            initTheme();
            updateMenuUI();
            dd.classList.remove('show');
        };
    });
    
    document.querySelectorAll('[data-emoji]').forEach(i => {
        i.onclick = () => {
            setEmojiSet(i.dataset.emoji);
            dd.classList.remove('show');
        };
    });
    
    updateMenuUI();
}

window.initTheme = initTheme;
window.initMenu = initMenu;
window.getWeatherEmojiHtml = getWeatherEmojiHtml;
window.updateBackground = updateBackground;
window.requestLocation = requestLocation;
window.reverseGeocode = reverseGeocode;
window.fetchWeatherData = fetchWeatherData;
window.getWeatherDescription = getWeatherDescription;
window.getWindDirection = getWindDirection;
window.hPaToMmHg = hPaToMmHg;
window.formatTime = formatTime;
window.getCurrentTimeString = getCurrentTimeString;