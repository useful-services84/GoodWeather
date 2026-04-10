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
        loadingUI.style.display = 'flex';
        forecastContent.style.display = 'none';
        errorUI.style.display = 'none';
    }

    function showContent() {
        loadingUI.style.display = 'none';
        forecastContent.style.display = 'block';
        errorUI.style.display = 'none';
    }

    function showError(msg) {
        loadingUI.style.display = 'none';
        forecastContent.style.display = 'none';
        errorUI.style.display = 'flex';
        errorText.textContent = msg || 'Неизвестная ошибка';
    }

    function updateUI(data, locationInfo) {
        const current = data.current;
        const daily = data.daily;
        
        // Шапка
        cityDisplay.textContent = locationInfo.main;
        regionDisplay.textContent = locationInfo.region;
        coordsDisplay.textContent = `${currentLat.toFixed(4)}°, ${currentLon.toFixed(4)}°`;
        
        const weatherCode = current.weather_code;
        tempDisplay.textContent = `${Math.round(current.temperature_2m)}°C`;
        descDisplay.textContent = `${getWeatherEmoji(weatherCode)} ${getWeatherDescription(weatherCode)}`;
        
        const updateTime = current.time ? new Date(current.time) : new Date();
        updateTimeDisplay.textContent = `Обновлено: ${updateTime.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
        
        updateBackground(weatherCode);
        
        // Прогноз
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
            console.error(error);
            showError(error.message);
            document.getElementById('bgLayer').style.backgroundImage = 'linear-gradient(145deg, #1e3c72, #2a5298)';
        }
    }

    document.getElementById('refreshBtn').addEventListener('click', loadWeatherData);
    document.getElementById('errorRetryBtn').addEventListener('click', loadWeatherData);

    loadWeatherData();

    setInterval(() => {
        if (currentLat && currentLon && errorUI.style.display === 'none') {
            loadWeatherData();
        }
    }, 30 * 60 * 1000);
})();