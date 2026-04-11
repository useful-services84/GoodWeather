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
    const uvDisplay = document.getElementById('uvDisplay');
    const pressureDisplay = document.getElementById('pressureDisplay');
    const precipDisplay = document.getElementById('precipDisplay');
    const sunriseDisplay = document.getElementById('sunriseDisplay');
    const sunsetDisplay = document.getElementById('sunsetDisplay');

    let currentLat = null;
    let currentLon = null;

    function showLoading() {
        loadingUI.style.display = 'flex';
        detailsContent.style.display = 'none';
        errorUI.style.display = 'none';
    }

    function showContent() {
        loadingUI.style.display = 'none';
        detailsContent.style.display = 'block';
        errorUI.style.display = 'none';
    }

    function showError(msg) {
        loadingUI.style.display = 'none';
        detailsContent.style.display = 'none';
        errorUI.style.display = 'flex';
        errorText.textContent = msg || 'Неизвестная ошибка';
    }

    function updateUI(data, locationInfo) {
        const current = data.current;
        const daily = data.daily;
        
        cityDisplay.textContent = locationInfo.main;
        regionDisplay.textContent = locationInfo.region;
        coordsDisplay.textContent = `${currentLat.toFixed(4)}°, ${currentLon.toFixed(4)}°`;
        
        const weatherCode = current.weather_code;
        tempDisplay.textContent = `${Math.round(current.temperature_2m)}°C`;
        descDisplay.textContent = `${getWeatherEmoji(weatherCode)} ${getWeatherDescription(weatherCode)}`;
        
        updateTimeDisplay.textContent = `Обновлено: ${getCurrentTimeString()}`;
        
        updateBackground(weatherCode);
        
        feelsLikeDisplay.textContent = Math.round(current.apparent_temperature);
        humidityDisplay.textContent = Math.round(current.relative_humidity_2m);
        windSpeedDisplay.textContent = current.wind_speed_10m.toFixed(1);
        windDirDisplay.textContent = getWindDirection(current.wind_direction_10m);
        windGustDisplay.textContent = current.wind_gusts_10m?.toFixed(1) || '—';
        cloudDisplay.textContent = Math.round(current.cloud_cover);
        visibilityDisplay.textContent = (current.visibility / 1000).toFixed(1);
        uvDisplay.textContent = current.uv_index?.toFixed(1) || '—';
        pressureDisplay.textContent = hPaToMmHg(current.surface_pressure);
        precipDisplay.textContent = current.precipitation?.toFixed(1) || '0.0';
        sunriseDisplay.textContent = formatTime(daily.sunrise?.[0]);
        sunsetDisplay.textContent = formatTime(daily.sunset?.[0]);
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

    document.getElementById('refreshBtn').addEventListener('click', loadWeatherData);
    document.getElementById('errorRetryBtn').addEventListener('click', loadWeatherData);

    initTheme();
    initMenu();
    loadWeatherData();

    setInterval(() => {
        if (currentLat && currentLon && errorUI.style.display === 'none') {
            loadWeatherData();
        }
    }, 30 * 60 * 1000);
})();