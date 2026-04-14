var WEATHER_BG_MAP = {
    clear: 'img/clear.jpg', partly_cloudy: 'img/partly-cloudy.jpg',
    cloudy: 'img/cloudy.jpg', fog: 'img/fog.jpg', rain: 'img/rain.jpg',
    snow: 'img/snow.jpg', thunderstorm: 'img/thunderstorm.jpg', default: 'img/default.jpg'
};

var API_URLS = [
    'https://api.open-meteo.com/v1/dwd-icon',
    'https://vpn.matvey-gadackiy2011.workers.dev/v1/dwd-icon'
];

var currentTheme = localStorage.getItem('theme') || 'light';
var emojiSet = localStorage.getItem('emojiSet') || 'system';
var sunsetTime = null;

var FLUENT_SVG_MAP = {
    0:'Sun.svg', 1:'Sun behind small cloud.svg', 2:'Sun behind cloud.svg',
    3:'Cloud.svg', 45:'Fog.svg', 48:'Fog.svg', 
    51:'Sun behind rain cloud.svg', 53:'Sun behind rain cloud.svg', 55:'Sun behind rain cloud.svg',
    61:'Cloud with rain.svg', 63:'Cloud with rain.svg', 65:'Cloud with rain.svg', 
    71:'Cloud with snow.svg', 73:'Cloud with snow.svg', 75:'Cloud with snow.svg', 
    80:'Cloud with rain.svg', 81:'Cloud with rain.svg', 82:'Cloud with rain.svg', 
    85:'Cloud with snow.svg', 86:'Cloud with snow.svg', 
    95:'Cloud with lightning.svg', 96:'Cloud with lightning and rain.svg', 99:'Cloud with lightning and rain.svg'
};

var FLUENT_NIGHT_MAP = {
    0:'Crescent moon.svg', 1:'Crescent moon.svg', 2:'Crescent moon.svg',
    3:'Cloud.svg', 45:'Fog.svg', 48:'Fog.svg',
    51:'Cloud with rain.svg', 53:'Cloud with rain.svg', 55:'Cloud with rain.svg',
    61:'Cloud with rain.svg', 63:'Cloud with rain.svg', 65:'Cloud with rain.svg',
    71:'Cloud with snow.svg', 73:'Cloud with snow.svg', 75:'Cloud with snow.svg',
    80:'Cloud with rain.svg', 81:'Cloud with rain.svg', 82:'Cloud with rain.svg',
    85:'Cloud with snow.svg', 86:'Cloud with snow.svg',
    95:'Cloud with lightning.svg', 96:'Cloud with lightning and rain.svg', 99:'Cloud with lightning and rain.svg'
};

var SYSTEM_EMOJIS = {
    0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',
    61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',
    82:'🌧️',85:'❄️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'
};

var SYSTEM_NIGHT_EMOJIS = {
    0:'🌙',1:'🌙',2:'☁️',3:'☁️',45:'🌫️',48:'🌫️',
    51:'🌧️',53:'🌧️',55:'🌧️',61:'🌧️',63:'🌧️',65:'🌧️',
    71:'🌨️',73:'🌨️',75:'❄️',80:'🌧️',81:'🌧️',82:'🌧️',
    85:'❄️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'
};

var cachedWeatherData = null;
var cachedLocation = null;
var cacheTimestamp = 0;
var CACHE_DURATION = 10 * 60 * 1000;

function getWeatherDescription(c) { 
    var m = {
        0:'Ясно',1:'Преимущественно ясно',2:'Переменная облачность',3:'Пасмурно',
        45:'Туман',48:'Изморозь',51:'Морось',53:'Морось',55:'Морось',
        61:'Дождь',63:'Дождь',65:'Дождь',71:'Снег',73:'Снег',75:'Снег',
        80:'Ливень',81:'Ливень',82:'Ливень',85:'Снегопад',86:'Снегопад',
        95:'Гроза',96:'Гроза',99:'Гроза'
    }; 
    return m[c] || 'Неизвестно'; 
}

function isNight() { 
    if (!sunsetTime) return false; 
    var n = new Date(), s = new Date(sunsetTime); 
    s.setMinutes(s.getMinutes() + 30); 
    return n > s; 
}

function isTimeNight(timeString) {
    if (!cachedWeatherData || !cachedWeatherData.daily || !cachedWeatherData.daily.sunrise || !cachedWeatherData.daily.sunset) {
        var hour = new Date(timeString).getHours();
        return hour < 6 || hour >= 22;
    }
    var time = new Date(timeString);
    var sunrise = new Date(cachedWeatherData.daily.sunrise[0]);
    var sunset = new Date(cachedWeatherData.daily.sunset[0]);
    var hour = time.getHours();
    var sunriseHour = sunrise.getHours();
    var sunsetHour = sunset.getHours();
    return hour < sunriseHour || hour >= sunsetHour;
}

function getWeatherEmojiForTime(code, timeString) {
    var isNightTime = isTimeNight(timeString);
    
    if (emojiSet === 'fluent') {
        if (isNightTime) {
            var f = FLUENT_NIGHT_MAP[code] || FLUENT_SVG_MAP[code] || 'Cloud.svg';
            return '<img src="emoji/' + f + '" class="weather-icon" onerror="this.style.display=\'none\'">';
        }
        var f2 = FLUENT_SVG_MAP[code] || 'Cloud.svg';
        return '<img src="emoji/' + f2 + '" class="weather-icon" onerror="this.style.display=\'none\'">';
    }
    
    if (isNightTime) {
        return SYSTEM_NIGHT_EMOJIS[code] || SYSTEM_EMOJIS[code] || '🌡️';
    }
    return SYSTEM_EMOJIS[code] || '🌡️';
}

function getWeatherEmojiHtml(code) {
    if (code === 0 && isNight()) {
        if (emojiSet === 'fluent') return '<img src="emoji/Crescent moon.svg" class="weather-icon" onerror="this.style.display=\'none\'">';
        else return '🌙';
    }
    if (emojiSet === 'fluent') {
        var f = FLUENT_SVG_MAP[code] || 'Cloud.svg';
        return '<img src="emoji/' + f + '" class="weather-icon" onerror="this.style.display=\'none\'">';
    }
    return SYSTEM_EMOJIS[code] || '🌡️';
}

function getWindDirection(d) { 
    return ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'][Math.round(d / 45) % 8]; 
}

function hPaToMmHg(h) { 
    return Math.round(h * 0.75006); 
}

function formatTime(iso) { 
    return new Date(iso).toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}); 
}

function getCurrentTimeString() { 
    return new Date().toLocaleTimeString('ru-RU', {hour:'2-digit', minute:'2-digit'}); 
}

function updateBackground(code) {
    var bg = document.getElementById('bgLayer'); 
    if (!bg) return;
    var cat = ['clear','partly_cloudy','cloudy','fog','rain','snow','thunderstorm','default'][
        code === 0 ? 0 : code === 1 || code === 2 ? 1 : code === 3 ? 2 : code >= 45 && code <= 48 ? 3 : code >= 51 && code <= 67 ? 4 : code >= 71 && code <= 77 ? 5 : code >= 95 ? 6 : 7
    ];
    var colors = {
        clear:'#4facfe', partly_cloudy:'#6b8cce', cloudy:'#5f6c7a',
        fog:'#b0bec5', rain:'#3a4e6b', snow:'#e0eaf5',
        thunderstorm:'#2c3e50', default:'#2b5876'
    };
    var imgUrl = WEATHER_BG_MAP[cat] || WEATHER_BG_MAP.default;
    bg.style.backgroundImage = 'url(\'' + imgUrl + '\')';
    var img = new Image();
    img.onerror = function() { 
        bg.style.backgroundImage = 'linear-gradient(145deg, ' + colors[cat] + ', ' + colors[cat] + 'dd)'; 
    };
    img.src = imgUrl;
}

async function requestLocation() {
    return new Promise(function(res, rej) {
        if (!navigator.geolocation) return rej(new Error('Нет геолокации'));
        navigator.geolocation.getCurrentPosition(
            function(p) { res({lat: p.coords.latitude, lon: p.coords.longitude}); },
            function() { rej(new Error('Доступ запрещён')); },
            {timeout: 10000}
        );
    });
}

async function reverseGeocode(lat, lon) {
    if (cachedLocation && (Date.now() - cacheTimestamp) < CACHE_DURATION * 6) {
        return cachedLocation;
    }
    
    try {
        var r = await fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lon + '&addressdetails=1&accept-language=ru');
        var d = await r.json(); 
        var a = d.address || {};
        cachedLocation = {
            main: a.city || a.town || a.village || 'Неизвестно',
            region: a.state || '',
            full: lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°'
        };
        return cachedLocation;
    } catch (e) {
        return {
            main: 'Местоположение',
            region: '',
            full: lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°'
        };
    }
}

async function fetchWeatherData(lat, lon, forceRefresh) {
    if (!forceRefresh && cachedWeatherData && (Date.now() - cacheTimestamp) < CACHE_DURATION) {
        return cachedWeatherData;
    }
    
    var p = new URLSearchParams({
        latitude: lat, longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,surface_pressure,precipitation,wind_gusts_10m',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
        hourly: 'temperature_2m,weather_code',
        timezone: 'auto',
        forecast_days: 7
    });
    
    for (var i = 0; i < API_URLS.length; i++) {
        var u = API_URLS[i];
        try {
            var r = await fetch(u + '?' + p.toString()); 
            if (r.ok) {
                var d = await r.json(); 
                if (d.daily && d.daily.sunset && d.daily.sunset[0]) sunsetTime = d.daily.sunset[0];
                cachedWeatherData = d;
                cacheTimestamp = Date.now();
                return d;
            }
        } catch (e) {}
    }
    throw new Error('API недоступен');
}

function initTheme() { 
    document.body.classList.toggle('dark-theme', currentTheme === 'dark'); 
}

function updateMenuUI() {
    var themeItems = document.querySelectorAll('[data-theme]');
    for (var i = 0; i < themeItems.length; i++) {
        themeItems[i].classList.toggle('active', themeItems[i].dataset.theme === currentTheme);
    }
    var emojiItems = document.querySelectorAll('[data-emoji]');
    for (var j = 0; j < emojiItems.length; j++) {
        emojiItems[j].classList.toggle('active', emojiItems[j].dataset.emoji === emojiSet);
    }
}

function setEmojiSet(s) {
    emojiSet = s; 
    localStorage.setItem('emojiSet', s);
    updateMenuUI();
    if (window.loadWeatherData) window.loadWeatherData();
}

function initMenu() {
    var btn = document.getElementById('menuBtn');
    var dd = document.getElementById('menuDropdown');
    if (!btn || !dd) return;
    
    btn.onclick = function(e) { 
        e.stopPropagation(); 
        dd.classList.toggle('show'); 
    };
    
    document.onclick = function() { 
        dd.classList.remove('show'); 
    };
    
    dd.onclick = function(e) { 
        e.stopPropagation(); 
    };
    
    var titles = document.querySelectorAll('.menu-section-title');
    for (var i = 0; i < titles.length; i++) {
        titles[i].onclick = function() {
            this.closest('.menu-section').classList.toggle('expanded');
        };
    }
    
    var themeItems = document.querySelectorAll('[data-theme]');
    for (var j = 0; j < themeItems.length; j++) {
        themeItems[j].onclick = function() {
            currentTheme = this.dataset.theme; 
            localStorage.setItem('theme', currentTheme);
            initTheme(); 
            updateMenuUI(); 
            dd.classList.remove('show');
        };
    }
    
    var emojiItems = document.querySelectorAll('[data-emoji]');
    for (var k = 0; k < emojiItems.length; k++) {
        emojiItems[k].onclick = function() {
            setEmojiSet(this.dataset.emoji); 
            dd.classList.remove('show');
        };
    }
    
    updateMenuUI();
}