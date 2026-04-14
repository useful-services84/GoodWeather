(function(){
    "use strict";
    
    const loading = document.getElementById('loadingUI');
    const content = document.getElementById('detailsContent');
    const errUI = document.getElementById('errorUI');
    const city = document.getElementById('cityDisplay');
    const region = document.getElementById('regionDisplay');
    const coords = document.getElementById('coordsDisplay');
    const temp = document.getElementById('tempDisplay');
    const feels = document.getElementById('feelsLikeHeader');
    const desc = document.getElementById('descDisplay');
    const upd = document.getElementById('updateTimeDisplay');
    const fLike = document.getElementById('feelsLikeDisplay');
    const hum = document.getElementById('humidityDisplay');
    const wSpeed = document.getElementById('windSpeedDisplay');
    const wDir = document.getElementById('windDirDisplay');
    const wGust = document.getElementById('windGustDisplay');
    const cloud = document.getElementById('cloudDisplay');
    const vis = document.getElementById('visibilityDisplay');
    const press = document.getElementById('pressureDisplay');
    const precip = document.getElementById('precipDisplay');
    const sunrise = document.getElementById('sunriseDisplay');
    const sunset = document.getElementById('sunsetDisplay');

    let lat, lon;

    function showLoading() {
        loading.style.display = 'flex';
        content.style.display = 'none';
        errUI.style.display = 'none';
    }
    
    function showContent() {
        loading.style.display = 'none';
        content.style.display = 'block';
        errUI.style.display = 'none';
    }
    
    function showError(m) {
        loading.style.display = 'none';
        content.style.display = 'none';
        errUI.style.display = 'flex';
        document.getElementById('errorText').textContent = m;
    }

    function updateUI(data, loc) {
        var cur = data.current;
        var daily = data.daily;
        
        city.textContent = loc.main;
        region.textContent = loc.region;
        coords.textContent = lat.toFixed(4) + '°, ' + lon.toFixed(4) + '°';
        
        var code = cur.weather_code;
        temp.textContent = Math.round(cur.temperature_2m) + '°';
        feels.textContent = 'Ощущается как ' + Math.round(cur.apparent_temperature) + '°';
        
        if (typeof getWeatherEmojiHtml === 'function' && typeof getWeatherDescription === 'function') {
            desc.innerHTML = getWeatherEmojiHtml(code) + ' ' + getWeatherDescription(code);
        }
        
        if (typeof getCurrentTimeString === 'function') {
            upd.textContent = 'Обновлено: ' + getCurrentTimeString();
        }
        
        if (typeof updateBackground === 'function') {
            updateBackground(code);
        }
        
        fLike.textContent = Math.round(cur.apparent_temperature);
        hum.textContent = Math.round(cur.relative_humidity_2m);
        wSpeed.textContent = cur.wind_speed_10m.toFixed(1);
        
        if (typeof getWindDirection === 'function') {
            wDir.textContent = getWindDirection(cur.wind_direction_10m);
        }
        
        wGust.textContent = cur.wind_gusts_10m ? cur.wind_gusts_10m.toFixed(1) : '—';
        cloud.textContent = Math.round(cur.cloud_cover);
        vis.textContent = (cur.visibility / 1000).toFixed(1);
        
        if (typeof hPaToMmHg === 'function') {
            press.textContent = hPaToMmHg(cur.surface_pressure);
        }
        
        precip.textContent = cur.precipitation ? cur.precipitation.toFixed(1) : '0.0';
        
        if (typeof formatTime === 'function') {
            sunrise.textContent = formatTime(daily.sunrise[0]);
            sunset.textContent = formatTime(daily.sunset[0]);
        }
    }

    async function loadWeatherData() {
        showLoading();
        try {
            if (typeof requestLocation !== 'function') throw new Error('requestLocation not found');
            
            var p = await requestLocation();
            lat = p.lat;
            lon = p.lon;
            
            if (typeof reverseGeocode !== 'function') throw new Error('reverseGeocode not found');
            if (typeof fetchWeatherData !== 'function') throw new Error('fetchWeatherData not found');
            
            var results = await Promise.all([
                reverseGeocode(lat, lon),
                fetchWeatherData(lat, lon)
            ]);
            
            var loc = results[0];
            var data = results[1];
            
            updateUI(data, loc);
            showContent();
        } catch (e) {
            showError(e.message);
        }
    }

    window.loadWeatherData = loadWeatherData;
    
    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', loadWeatherData);
    }
    
    var errorRetryBtn = document.getElementById('errorRetryBtn');
    if (errorRetryBtn) {
        errorRetryBtn.addEventListener('click', loadWeatherData);
    }
    
    if (typeof initTheme === 'function') initTheme();
    if (typeof initMenu === 'function') initMenu();
    
    loadWeatherData();
})();