(function(){
    const loading = document.getElementById('loadingUI');
    const forecastView = document.getElementById('forecastView');
    const hourlyView = document.getElementById('hourlyView');
    const errorUI = document.getElementById('errorUI');
    const forecastScroll = document.getElementById('forecastScroll');
    const hourlyScroll = document.getElementById('hourlyScroll');
    const hourlyTitle = document.getElementById('hourlyTitle');
    const chartSvg = document.getElementById('chartSvg');
    const backBtn = document.getElementById('backBtn');

    const cityDisplay = document.getElementById('cityDisplay');
    const regionDisplay = document.getElementById('regionDisplay');
    const coordsDisplay = document.getElementById('coordsDisplay');
    const tempDisplay = document.getElementById('tempDisplay');
    const feelsLikeHeader = document.getElementById('feelsLikeHeader');
    const descDisplay = document.getElementById('descDisplay');
    const updateTimeDisplay = document.getElementById('updateTimeDisplay');

    let currentLat, currentLon, weatherData;

    function showLoading() {
        loading.style.display = 'flex';
        forecastView.classList.add('hidden');
        hourlyView.classList.remove('active');
        errorUI.style.display = 'none';
    }

    function showContent() {
        loading.style.display = 'none';
        forecastView.classList.remove('hidden');
        hourlyView.classList.remove('active');
        errorUI.style.display = 'none';
    }

    function showError(msg) {
        loading.style.display = 'none';
        forecastView.classList.add('hidden');
        hourlyView.classList.remove('active');
        errorUI.style.display = 'flex';
        document.getElementById('errorText').textContent = msg;
    }

    function drawChart(temps) {
        if (!chartSvg || !temps.length) return;
        const w = Math.max(600, temps.length * 50);
        chartSvg.setAttribute('viewBox', `0 0 ${w} 100`);
        const h = 100, pad = 40;
        const max = Math.max(...temps), min = Math.min(...temps);
        const range = max - min || 1;
        
        const pts = temps.map((t, i) => ({
            x: pad + (i / (temps.length - 1)) * (w - 2 * pad),
            y: h - pad - ((t - min) / range) * (h - 2 * pad)
        }));
        
        let path = `M ${pts[0].x} ${pts[0].y}`;
        for (let i = 1; i < pts.length; i++) path += ` L ${pts[i].x} ${pts[i].y}`;
        
        let circles = '', labels = '';
        pts.forEach((p, i) => {
            circles += `<circle cx="${p.x}" cy="${p.y}" r="4" class="chart-point"/>`;
            labels += `<text x="${p.x}" y="${p.y - 8}" class="chart-label">${Math.round(temps[i])}°</text>`;
        });
        
        chartSvg.innerHTML = `<path d="${path}" class="chart-line"/>${circles}${labels}`;
    }

    function showHourly(dayIndex) {
        if (!weatherData?.hourly) return;
        const daily = weatherData.daily;
        const hourly = weatherData.hourly;
        const target = daily.time[dayIndex];
        
        const hours = [], temps = [];
        for (let i = 0; i < hourly.time.length; i++) {
            if (hourly.time[i].startsWith(target)) {
                hours.push({ time: hourly.time[i], temp: hourly.temperature_2m[i], code: hourly.weather_code[i] });
                temps.push(hourly.temperature_2m[i]);
            }
        }
        if (!hours.length) return;
        
        hourlyTitle.textContent = new Date(target).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
        hourlyScroll.innerHTML = hours.map(h => `
            <div class="hourly-card">
                <div class="hourly-time">${new Date(h.time).getHours()}:00</div>
                <div class="hourly-icon">${getWeatherEmojiHtml(h.code)}</div>
                <div class="hourly-temp">${Math.round(h.temp)}°</div>
            </div>
        `).join('');
        
        drawChart(temps);
        forecastView.classList.add('hidden');
        hourlyView.classList.add('active');
    }

    function updateUI(data, loc) {
        weatherData = data;
        const cur = data.current, daily = data.daily;
        
        cityDisplay.textContent = loc.main;
        regionDisplay.textContent = loc.region;
        coordsDisplay.textContent = `${currentLat.toFixed(4)}°, ${currentLon.toFixed(4)}°`;
        
        const code = cur.weather_code;
        tempDisplay.textContent = `${Math.round(cur.temperature_2m)}°`;
        feelsLikeHeader.textContent = `Ощущается как ${Math.round(cur.apparent_temperature)}°`;
        descDisplay.innerHTML = `${getWeatherEmojiHtml(code)} ${getWeatherDescription(code)}`;
        updateTimeDisplay.textContent = `Обновлено: ${getCurrentTimeString()}`;
        updateBackground(code);
        
        forecastScroll.innerHTML = daily.time.map((t, i) => {
            const d = new Date(t);
            const name = i === 0 ? 'Сегодня' : d.toLocaleDateString('ru-RU', { weekday: 'short' });
            const date = d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            return `
                <div class="forecast-card" data-day="${i}">
                    <div class="forecast-day">${name}</div>
                    <div class="forecast-date">${date}</div>
                    <div class="forecast-icon">${getWeatherEmojiHtml(daily.weather_code[i])}</div>
                    <div class="forecast-temp-max">${Math.round(daily.temperature_2m_max[i])}°</div>
                    <div class="forecast-temp-min">${Math.round(daily.temperature_2m_min[i])}°</div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.forecast-card').forEach(card => {
            card.addEventListener('click', () => showHourly(parseInt(card.dataset.day)));
        });
    }

    async function loadWeatherData() {
        showLoading();
        try {
            const pos = await requestLocation();
            currentLat = pos.lat; currentLon = pos.lon;
            const [loc, data] = await Promise.all([reverseGeocode(currentLat, currentLon), fetchWeatherData(currentLat, currentLon)]);
            updateUI(data, loc);
            showContent();
        } catch (e) {
            showError(e.message);
        }
    }

    backBtn.addEventListener('click', () => {
        forecastView.classList.remove('hidden');
        hourlyView.classList.remove('active');
    });

    document.getElementById('refreshBtn').addEventListener('click', loadWeatherData);
    document.getElementById('errorRetryBtn').addEventListener('click', loadWeatherData);

    initTheme();
    initMenu();
    loadWeatherData();
})();