(function(){
    "use strict";

    const loadingUI = document.getElementById('loadingUI');
    const forecastView = document.getElementById('forecastView');
    const hourlyView = document.getElementById('hourlyView');
    const errorUI = document.getElementById('errorUI');
    const errorText = document.getElementById('errorText');
    const forecastScroll = document.getElementById('forecastScroll');

    const cityDisplay = document.getElementById('cityDisplay');
    const regionDisplay = document.getElementById('regionDisplay');
    const coordsDisplay = document.getElementById('coordsDisplay');
    const tempDisplay = document.getElementById('tempDisplay');
    const feelsLikeHeader = document.getElementById('feelsLikeHeader');
    const descDisplay = document.getElementById('descDisplay');
    const updateTimeDisplay = document.getElementById('updateTimeDisplay');

    const hourlyTitle = document.getElementById('hourlyTitle');
    const hourlyScroll = document.getElementById('hourlyScroll');
    const chartSvg = document.getElementById('chartSvg');
    const backBtn = document.getElementById('backBtn');

    let currentLat = null;
    let currentLon = null;
    let weatherData = null;

    function showLoading() {
        if (loadingUI) loadingUI.style.display = 'flex';
        if (forecastView) forecastView.style.display = 'none';
        if (hourlyView) hourlyView.style.display = 'none';
        if (errorUI) errorUI.style.display = 'none';
    }

    function showContent() {
        if (loadingUI) loadingUI.style.display = 'none';
        if (forecastView) forecastView.classList.remove('hidden');
        if (hourlyView) hourlyView.classList.remove('active');
        if (errorUI) errorUI.style.display = 'none';
    }

    function showError(msg) {
        if (loadingUI) loadingUI.style.display = 'none';
        if (forecastView) forecastView.style.display = 'none';
        if (hourlyView) hourlyView.style.display = 'none';
        if (errorUI) errorUI.style.display = 'flex';
        if (errorText) errorText.textContent = msg || 'Неизвестная ошибка';
    }

    function drawChart(temperatures) {
        if (!chartSvg) return;
        
        const width = Math.max(600, temperatures.length * 50);
        chartSvg.setAttribute('viewBox', `0 0 ${width} 100`);
        
        const height = 100;
        const padding = 40;
        const maxTemp = Math.max(...temperatures);
        const minTemp = Math.min(...temperatures);
        const range = maxTemp - minTemp || 1;
        
        const points = temperatures.map((t, i) => ({
            x: padding + (i / (temperatures.length - 1)) * (width - 2 * padding),
            y: height - padding - ((t - minTemp) / range) * (height - 2 * padding)
        }));
        
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
        
        let circles = '';
        let labels = '';
        points.forEach((p, i) => {
            circles += `<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"/>`;
            labels += `<text x="${p.x}" y="${p.y - 8}" class="chart-label">${Math.round(temperatures[i])}°</text>`;
        });
        
        chartSvg.innerHTML = `
            <path d="${pathD}" class="chart-line"/>
            ${circles}
            ${labels}
        `;
    }

    function showHourlyForecast(dayIndex) {
        if (!weatherData || !weatherData.hourly) return;
        
        const hourly = weatherData.hourly;
        const daily = weatherData.daily;
        const targetDate = daily.time[dayIndex];
        
        const dayHours = [];
        const dayTemps = [];
        
        for (let i = 0; i < hourly.time.length; i++) {
            if (hourly.time[i].startsWith(targetDate)) {
                dayHours.push({
                    time: hourly.time[i],
                    temp: hourly.temperature_2m[i],
                    code: hourly.weather_code[i]
                });
                dayTemps.push(hourly.temperature_2m[i]);
            }
        }
        
        if (dayHours.length === 0) return;
        
        const date = new Date(targetDate);
        hourlyTitle.textContent = date.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
        
        hourlyScroll.innerHTML = '';
        dayHours.forEach(hour => {
            const time = new Date(hour.time);
            const card = document.createElement('div');
            card.className = 'hourly-card';
            card.innerHTML = `
                <div class="hourly-time">${time.getHours()}:00</div>
                <div class="hourly-icon">${getWeatherEmojiHtml(hour.code)}</div>
                <div class="hourly-temp">${Math.round(hour.temp)}°</div>
            `;
            hourlyScroll.appendChild(card);
        });
        
        drawChart(dayTemps);
        
        forecastView.classList.add('hidden');
        hourlyView.classList.add('active');
    }

    function updateUI(data, locationInfo) {
        weatherData = data;
        const current = data.current;
        const daily = data.daily;
        
        if (cityDisplay) cityDisplay.textContent = locationInfo.main;
        if (regionDisplay) regionDisplay.textContent = locationInfo.region;
        if (coordsDisplay) coordsDisplay.textContent = `${currentLat.toFixed(4)}°, ${currentLon.toFixed(4)}°`;
        
        const weatherCode = current.weather_code;
        if (tempDisplay) tempDisplay.textContent = `${Math.round(current.temperature_2m)}°`;
        if (feelsLikeHeader) feelsLikeHeader.textContent = `Ощущается как ${Math.round(current.apparent_temperature)}°`;
        if (descDisplay) {
            descDisplay.innerHTML = `${getWeatherEmojiHtml(weatherCode)} ${getWeatherDescription(weatherCode)}`;
        }
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
                    <div class="forecast-icon">${getWeatherEmojiHtml(code)}</div>
                    <div class="forecast-temp-max">${Math.round(daily.temperature_2m_max[i])}°</div>
                    <div class="forecast-temp-min">${Math.round(daily.temperature_2m_min[i])}°</div>
                `;
                card.addEventListener('click', () => showHourlyForecast(i));
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

            const [locationInfo, data] = await Promise.all([
                reverseGeocode(currentLat, currentLon),
                fetchWeatherData(currentLat, currentLon)
            ]);
            
            updateUI(data, locationInfo);
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

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            forecastView.classList.remove('hidden');
            hourlyView.classList.remove('active');
        });
    }

    initTheme();
    initMenu();
    loadWeatherData();

    setInterval(() => {
        if (currentLat && currentLon && errorUI && errorUI.style.display === 'none') {
            loadWeatherData();
        }
    }, 30 * 60 * 1000);
})();