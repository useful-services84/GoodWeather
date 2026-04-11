(function(){
    "use strict";

    const loadingUI = document.getElementById('loadingUI');
    const forecastContent = document.getElementById('forecastContent');
    const errorUI = document.getElementById('errorUI');
    const errorText = document.getElementById('errorText');
    const forecastScroll = document.getElementById('forecastScroll');

    const cityDisplay = document.getElementById('cityDisplay');
    const regionDisplay = document.getElementById('regionDisplay');
    const coordsDisplay = document.getElementById('coordsDisplay');
    const tempDisplay = document.getElementById('tempDisplay');
    const descDisplay = document.getElementById('descDisplay');
    const updateTimeDisplay = document.getElementById('updateTimeDisplay');

    let currentLat = null;
    let currentLon = null;

    function showLoading() {
        if (loadingUI) loadingUI.style.display = 'flex';
        if (forecastContent) forecastContent.style.display = 'none';
        if (errorUI) errorUI.style.display = 'none';
    }

    function showContent() {
        if (loadingUI) loadingUI.style.display = 'none';
        if (forecastContent) forecastContent.style.display = 'block';
        if (errorUI) errorUI.style.display = 'none';
    }

    function showError(msg) {
        if (loadingUI) loadingUI.style.display = 'none';
        if (forecastContent) forecastContent.style.display = 'none';
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
        
        if (forecastScroll) {
            forecastScroll.innerHTML = '';
            
            for (let i = 0; i < daily.time.length; i++) {
                const date = new Date(daily.time[i]);
                const dayName = i === 0 ? 'Сегодня' : date.toLocaleDateString('ru-RU', { weekday: 'short' });
                const dayDate = date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                const code = daily.weather_code[i];
                
                const card = document.createElement('div');
                card.className = 'forecast-card';
                card.innerHTML = `
                    <div class="forecast-day">${dayName}</div>
                    <div class="forecast-date">${dayDate}</div>
                    <div class="forecast-icon">${getWeatherEmoji(code)}</div>
                    <div class="forecast-temp-max">${Math.round(daily.temperature_2m_max[i])}°</div>
                    <div class="forecast-temp-min">${Math.round(daily.temperature_2m_min[i])}°</div>
                `;
                forecastScroll.appendChild(card);
            }
        }
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