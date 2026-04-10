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

// Настройки прокси
let proxyMode = localStorage.getItem('proxyMode') || 'auto';
let currentProxyUsed = 'none';

const PROXY_URLS = {
    allorigins: 'https://api.allorigins.win/raw?url=',
    thingproxy: 'https://thingproxy.freeboard.io/fetch/'
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

// Умная загрузка с перебором прокси
async function fetchWithSmartProxy(url) {
    currentProxyUsed = 'none';
    
    // Режим "без прокси"
    if (proxyMode === 'none') {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    // Режим "allorigins"
    if (proxyMode === 'allorigins') {
        currentProxyUsed = 'allorigins';
        const proxyUrl = PROXY_URLS.allorigins + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    // Режим "thingproxy"
    if (proxyMode === 'thingproxy') {
        currentProxyUsed = 'thingproxy';
        const proxyUrl = PROXY_URLS.thingproxy + url;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }
    
    // Автоматический режим — перебор
    if (proxyMode === 'auto') {
        // 1. Прямой запрос
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                currentProxyUsed = 'none';
                return await response.json();
            }
        } catch (e) {
            console.log('Прямой запрос не удался, пробуем allorigins...');
        }
        
        // 2. AllOrigins
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const proxyUrl = PROXY_URLS.allorigins + encodeURIComponent(url);
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                currentProxyUsed = 'allorigins';
                return await response.json();
            }
        } catch (e) {
            console.log('AllOrigins не удался, пробуем thingproxy...');
        }
        
        // 3. ThingProxy
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            const proxyUrl = PROXY_URLS.thingproxy + url;
            const response = await fetch(proxyUrl, { signal: controller.signal });
            clearTimeout(timeoutId);
            
            if (response.ok) {
                currentProxyUsed = 'thingproxy';
                return await response.json();
            }
        } catch (e) {
            console.log('ThingProxy не удался');
        }
        
        throw new Error('Все способы подключения не сработали');
    }
    
    throw new Error('Неизвестный режим прокси');
}

async function fetchWeatherData(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,uv_index,surface_pressure,precipitation,wind_gusts_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max,sunrise,sunset',
        timezone: 'auto',
        forecast_days: 7
    });

    const url = `https://api.open-meteo.com/v1/dwd-icon?${params.toString()}`;
    return await fetchWithSmartProxy(url);
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

// Инициализация меню
function initMenu() {
    const menuBtn = document.getElementById('menuBtn');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (!menuBtn || !menuDropdown) return;
    
    // Открытие/закрытие меню
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menuDropdown.classList.toggle('show');
    });
    
    // Закрытие при клике вне меню
    document.addEventListener('click', () => {
        menuDropdown.classList.remove('show');
    });
    
    menuDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    // Установка активного режима
    const items = document.querySelectorAll('.menu-item[data-proxy]');
    items.forEach(item => {
        if (item.dataset.proxy === proxyMode) {
            item.classList.add('active');
        }
        
        item.addEventListener('click', () => {
            const mode = item.dataset.proxy;
            proxyMode = mode;
            localStorage.setItem('proxyMode', mode);
            
            items.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            
            menuDropdown.classList.remove('show');
            
            // Перезагрузка данных
            if (typeof loadWeatherData === 'function') {
                loadWeatherData();
            }
        });
    });
    
    // Обновление статуса
    updateProxyStatus();
}

function updateProxyStatus() {
    const statusEl = document.getElementById('proxyStatus');
    if (!statusEl) return;
    
    const modeNames = {
        auto: 'Авто',
        none: 'Без прокси',
        allorigins: 'AllOrigins',
        thingproxy: 'ThingProxy'
    };
    
    statusEl.textContent = `Режим: ${modeNames[proxyMode] || proxyMode} | Использован: ${currentProxyUsed}`;
}

// Экспорт для глобального доступа
window.proxyMode = proxyMode;
window.currentProxyUsed = currentProxyUsed;
window.updateProxyStatus = updateProxyStatus;