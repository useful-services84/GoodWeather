(function(){
    "use strict";

    const loadingUI = document.getElementById('loadingUI');
    const detailsContent = document.getElementById('detailsContent');
    const errorUI = document.getElementById('errorUI');
    const errorText = document.getElementById('errorText');

    const cityDisplay = document.getElementById('cityDisplay');
    const regionDisplay = document.getElementById('regionDisplay');
    const coordsDisplay = document.getElementById('coordsDisplay');
    const tempDisplay = document.getElementById('tempDisplay');
    const descDisplay = document.getElementById('descDisplay');
    const updateTimeDisplay = document.getElementById('updateTimeDisplay');

    const feelsLikeDisplay = document.getElementById('feelsLikeDisplay');
    const humidityDisplay = document.getElementById('humidityDisplay');
    const windSpeedDisplay = document.getElementById('windSpeedDisplay');
    const windDirDisplay = document.getElementById('windDirDisplay');
    const windGustDisplay = document.getElementById('windGustDisplay');
    const cloudDisplay = document.getElementById('cloudDisplay');
    const visibilityDisplay = document.getElementById('visibilityDisplay');
    const pressureDisplay = document.getElementById('pressureDisplay');
    const precipDisplay = document.getElementById('precipDisplay');
    const sunriseDisplay = document.getElementById('sunriseDisplay');
    const sunsetDisplay = document.getElementById('sunsetDisplay');

    let currentLat = null;
    let currentLon = null;

    function showLoading() {
        if (loadingUI) loadingUI.style.display = 'flex';
        if (detailsContent) detailsContent.style.display = 'none';
        if (errorUI) errorUI.style.display = 'none';
    }

    function showContent() {
        if (loadingUI) loadingUI.style.display = 'none';
        if (detailsContent) detailsContent.style.display = 'block';
        if (errorUI) errorUI.style.display = 'none';
    }

    function showError(msg) {
        if (loadingUI) loadingUI.style.display = 'none';
        if (detailsContent) detailsContent.style.display = 'none';
        if (errorUI) errorUI.style.display = 'flex';
        if (errorText) errorText.textContent = msg || 'Неизвестная ошибка';
    }

    function updateUI(data, locationInfo) {
        const current = data.current;
        const daily = data.daily;
        
        if (cityDisplay) cityDisplay.textContent = locationInfo.main;
        if (regionDisplay) regionDisplay.textContent = locationInfo.region;
        if (coordsDisplay) coordsDisplay.textContent = `${currentLat.toFixed(4)}°, ${currentLon.toFixed(4)}°`;
        
        const weatherCode = current.weather_code;
        if (tempDisplay) tempDisplay.textContent = `${Math.round(current.temperature_2m)}°C`;
        if (descDisplay) descDisplay.textContent = `${getWeatherEmoji(weatherCode)} ${getWeatherDescription(weatherCode)}`;
        
        if (updateTimeDisplay) updateTimeDisplay.textContent = `Обновлено: ${getCurrentTimeString()}`;
        
        updateBackground(weatherCode);
        
        if (feelsLikeDisplay) feelsLikeDisplay.textContent = Math.round(current.apparent_temperature);
        if (humidityDisplay) humidityDisplay.textContent = Math.round(current.relative_humidity_2m);
        if (windSpeedDisplay) windSpeedDisplay.textContent = current.wind_speed_10m.toFixed(1);
        if (windDirDisplay) windDirDisplay.textContent = getWindDirection(current.wind_direction_10m);
        if (windGustDisplay) windGustDisplay.textContent = current.wind_gusts_10m?.toFixed(1) || '—';
        if (cloudDisplay) cloudDisplay.textContent = Math.round(current.cloud_cover);
        if (visibilityDisplay) visibilityDisplay.textContent = (current.visibility / 1000).toFixed(1);
        if (pressureDisplay) pressureDisplay.textContent = hPaToMmHg(current.surface_pressure);
        if (precipDisplay) precipDisplay.textContent = current.precipitation?.toFixed(1) || '0.0';
        if (sunriseDisplay && daily.sunrise) sunriseDisplay.textContent = formatTime(daily.sunrise[0]);
        if (sunsetDisplay && daily.sunset) sunsetDisplay.textContent = formatTime(daily.sunset[0]);
    }

    async function loadWeatherData() {
        showLoading();
        try {
            const pos = await requestLocation();
            currentLat = pos.lat;
            currentLon = pos.lon;

            const [locationInfo, weatherData] = await Promise.all([
                reverseGeocode(currentLat, currentLon),
                fetchWeatherData(currentLat, currentLon)
            ]);
            
            updateUI(weatherData, locationInfo);
            showContent();
        } catch (error) {
            console.error('Ошибка загрузки:', error);
            showError(error.message);
        }
    }

    window.loadWeatherData = loadWeatherData;

    const refreshBtn = document.getElementById('refreshBtn');
    const errorRetryBtn = document.getElementById('errorRetryBtn');
    
    if (refreshBtn) refreshBtn.addEventListener('click', loadWeatherData);
    if (errorRetryBtn) errorRetryBtn.addEventListener('click', loadWeatherData);

    initTheme();
    initMenu();
    loadWeatherData();

    setInterval(() => {
        if (currentLat && currentLon && errorUI && errorUI.style.display === 'none') {
            loadWeatherData();
        }
    }, 30 * 60 * 1000);
})();