const WEATHER_BG_MAP = {
    clear: 'img/clear.jpg', partly_cloudy: 'img/partly-cloudy.jpg',
    cloudy: 'img/cloudy.jpg', fog: 'img/fog.jpg', rain: 'img/rain.jpg',
    snow: 'img/snow.jpg', thunderstorm: 'img/thunderstorm.jpg', default: 'img/default.jpg'
};
const API_URLS = [
    'https://api.open-meteo.com/v1/dwd-icon',
    'https://vpn.matvey-gadackiy2011.workers.dev/v1/dwd-icon'
];

let currentTheme = localStorage.getItem('theme') || 'light';
let emojiSet = localStorage.getItem('emojiSet') || 'system';
let sunsetTime = null;

const FLUENT_SVG_MAP = {
    0:'Sun.svg', 1:'Sun behind small cloud.svg', 2:'Sun behind cloud.svg',
    3:'Cloud.svg', 45:'Fog.svg', 48:'Fog.svg', 51:'Cloud with rain.svg',
    53:'Cloud with rain.svg', 55:'Cloud with rain.svg', 61:'Sun behind rain cloud.svg',
    63:'Cloud with rain.svg', 65:'Cloud with rain.svg', 71:'Cloud with snow.svg',
    73:'Cloud with snow.svg', 75:'Cloud with snow.svg', 80:'Cloud with rain.svg',
    81:'Cloud with rain.svg', 82:'Cloud with rain.svg', 85:'Cloud with snow.svg',
    86:'Cloud with snow.svg', 95:'Cloud with lightning.svg',
    96:'Cloud with lightning and rain.svg', 99:'Cloud with lightning and rain.svg'
};
const SYSTEM_EMOJIS = {
    0:'☀️',1:'🌤️',2:'⛅',3:'☁️',45:'🌫️',48:'🌫️',51:'🌦️',53:'🌧️',55:'🌧️',
    61:'🌧️',63:'🌧️',65:'🌧️',71:'🌨️',73:'🌨️',75:'❄️',80:'🌦️',81:'🌧️',
    82:'🌧️',85:'❄️',86:'❄️',95:'⛈️',96:'⛈️',99:'⛈️'
};

function getWeatherDescription(c){ const m={0:'Ясно',1:'Преимущественно ясно',2:'Переменная облачность',3:'Пасмурно',45:'Туман',48:'Изморозь',51:'Морось',53:'Морось',55:'Морось',61:'Дождь',63:'Дождь',65:'Дождь',71:'Снег',73:'Снег',75:'Снег',80:'Ливень',81:'Ливень',82:'Ливень',85:'Снегопад',86:'Снегопад',95:'Гроза',96:'Гроза',99:'Гроза'}; return m[c]||'Неизвестно'; }
function isNight(){ if(!sunsetTime)return false; const n=new Date(),s=new Date(sunsetTime); s.setMinutes(s.getMinutes()+30); return n>s; }
function getWeatherEmojiHtml(code){
    if(code===0 && isNight()){
        if(emojiSet==='fluent') return '<img src="emoji/Crescent moon.svg" class="weather-icon" onerror="this.style.display=\'none\'">';
        else return '🌙';
    }
    if(emojiSet==='fluent'){
        const f=FLUENT_SVG_MAP[code]||'Cloud.svg';
        return `<img src="emoji/${f}" class="weather-icon" onerror="this.style.display=\'none\'">`;
    }
    return SYSTEM_EMOJIS[code]||'🌡️';
}
function getWindDirection(d){ return ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'][Math.round(d/45)%8]; }
function hPaToMmHg(h){ return Math.round(h*0.75006); }
function formatTime(iso){ return new Date(iso).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}); }
function getCurrentTimeString(){ return new Date().toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'}); }

function updateBackground(code){
    const bg=document.getElementById('bgLayer'); if(!bg)return;
    const cat=['clear','partly_cloudy','cloudy','fog','rain','snow','thunderstorm','default'][code===0?0:code===1||code===2?1:code===3?2:code>=45&&code<=48?3:code>=51&&code<=67?4:code>=71&&code<=77?5:code>=95?6:7];
    const colors={clear:'#4facfe',partly_cloudy:'#6b8cce',cloudy:'#5f6c7a',fog:'#b0bec5',rain:'#3a4e6b',snow:'#e0eaf5',thunderstorm:'#2c3e50',default:'#2b5876'};
    const imgUrl = WEATHER_BG_MAP[cat] || WEATHER_BG_MAP.default;
    bg.style.backgroundImage = `url('${imgUrl}')`;
    const img = new Image();
    img.onerror = () => { bg.style.backgroundImage = `linear-gradient(145deg, ${colors[cat]}, ${colors[cat]}dd)`; };
    img.src = imgUrl;
}

async function requestLocation(){
    return new Promise((res,rej)=>{
        if(!navigator.geolocation)return rej(new Error('Нет геолокации'));
        navigator.geolocation.getCurrentPosition(p=>res({lat:p.coords.latitude,lon:p.coords.longitude}),()=>rej(new Error('Доступ запрещён')),{timeout:10000});
    });
}
async function reverseGeocode(lat,lon){
    try{
        const r=await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&addressdetails=1&accept-language=ru`);
        const d=await r.json(); const a=d.address||{};
        return {main:a.city||a.town||a.village||'Неизвестно',region:a.state||'',full:`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`};
    }catch{return {main:'Местоположение',region:'',full:`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`};}
}
async function fetchWeatherData(lat,lon){
    const p=new URLSearchParams({latitude:lat,longitude:lon,current:'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,cloud_cover,wind_speed_10m,wind_direction_10m,visibility,surface_pressure,precipitation,wind_gusts_10m',daily:'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',hourly:'temperature_2m,weather_code',timezone:'auto',forecast_days:7});
    for(const u of API_URLS){
        try{const r=await fetch(`${u}?${p}`); if(r.ok){const d=await r.json(); if(d.daily?.sunset?.[0])sunsetTime=d.daily.sunset[0]; return d;}}catch{}
    }
    throw new Error('API недоступен');
}

function initTheme(){ document.body.classList.toggle('dark-theme',currentTheme==='dark'); }
function updateMenuUI(){
    document.querySelectorAll('[data-theme]').forEach(i=>i.classList.toggle('active',i.dataset.theme===currentTheme));
    document.querySelectorAll('[data-emoji]').forEach(i=>i.classList.toggle('active',i.dataset.emoji===emojiSet));
}
function setEmojiSet(s){
    emojiSet=s; localStorage.setItem('emojiSet',s);
    updateMenuUI();
    if(window.loadWeatherData) window.loadWeatherData();
}
function initMenu(){
    const btn=document.getElementById('menuBtn'), dd=document.getElementById('menuDropdown');
    if(!btn||!dd)return;
    btn.onclick=e=>{e.stopPropagation(); dd.classList.toggle('show');};
    document.onclick=()=>dd.classList.remove('show');
    dd.onclick=e=>e.stopPropagation();
    document.querySelectorAll('.menu-section-title').forEach(t=>t.onclick=()=>t.closest('.menu-section').classList.toggle('expanded'));
    document.querySelectorAll('[data-theme]').forEach(i=>i.onclick=()=>{
        currentTheme=i.dataset.theme; localStorage.setItem('theme',currentTheme);
        initTheme(); updateMenuUI(); dd.classList.remove('show');
    });
    document.querySelectorAll('[data-emoji]').forEach(i=>i.onclick=()=>{
        setEmojiSet(i.dataset.emoji); dd.classList.remove('show');
    });
    updateMenuUI();
}