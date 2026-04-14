(function(){
    const loading=document.getElementById('loadingUI'),
          fView=document.getElementById('forecastView'),
          hView=document.getElementById('hourlyView'),
          errUI=document.getElementById('errorUI'),
          fScroll=document.getElementById('forecastScroll'),
          hTitle=document.getElementById('hourlyTitle'),
          container=document.getElementById('hourlyScrollContainer'),
          backBtn=document.getElementById('backBtn'),
          city=document.getElementById('cityDisplay'),
          region=document.getElementById('regionDisplay'),
          coords=document.getElementById('coordsDisplay'),
          temp=document.getElementById('tempDisplay'),
          feels=document.getElementById('feelsLikeHeader'),
          desc=document.getElementById('descDisplay'),
          upd=document.getElementById('updateTimeDisplay');

    let lat,lon,weatherData;

    function showLoading(){loading.style.display='flex'; fView.classList.add('hidden'); hView.classList.remove('active'); errUI.style.display='none';}
    function showContent(){loading.style.display='none'; fView.classList.remove('hidden'); hView.classList.remove('active'); errUI.style.display='none';}
    function showError(m){loading.style.display='none'; fView.classList.add('hidden'); hView.classList.remove('active'); errUI.style.display='flex'; document.getElementById('errorText').textContent=m;}

    function getDayEmojiHtml(code) {
        if (emojiSet === 'fluent') {
            const f = FLUENT_SVG_MAP[code] || 'Cloud.svg';
            return `<img src="emoji/${f}" class="weather-icon" onerror="this.style.display='none'">`;
        }
        return SYSTEM_EMOJIS[code] || '🌡️';
    }

    function buildHourlyChart(hours, temps) {
        const itemWidth = 70;  // ширина одного часа в пикселях
        const totalWidth = hours.length * itemWidth;
        
        const chartHeight = 130;
        const padLeft = 35;
        const padRight = 35;
        const padTop = 20;
        const padBottom = 15;
        
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const tempRange = maxTemp - minTemp || 1;
        
        const chartAreaHeight = chartHeight - padTop - padBottom;
        const chartAreaWidth = totalWidth - padLeft - padRight;
        
        // Строим точки
        const points = temps.map((t, i) => {
            const x = padLeft + (i / (hours.length - 1)) * chartAreaWidth;
            const y = padTop + chartAreaHeight - ((t - minTemp) / tempRange) * chartAreaHeight;
            return { x, y, temp: t };
        });
        
        // Линия графика
        let pathD = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathD += ` L ${points[i].x} ${points[i].y}`;
        }
        
        // Кружки и подписи температур
        let circles = '';
        let tempLabels = '';
        points.forEach(p => {
            circles += `<circle cx="${p.x}" cy="${p.y}" r="4.5" class="chart-point"/>`;
            tempLabels += `<text x="${p.x}" y="${p.y - 8}" class="chart-label">${Math.round(p.temp)}°</text>`;
        });
        
        // SVG
        const svg = `
            <svg class="chart-svg" viewBox="0 0 ${totalWidth} ${chartHeight}" width="${totalWidth}" height="${chartHeight}">
                <path d="${pathD}" class="chart-line"/>
                ${circles}
                ${tempLabels}
            </svg>
        `;
        
        // Подписи часов снизу
        const labels = hours.map((h, i) => {
            const timeStr = new Date(h.time).getHours() + ':00';
            return `
                <div class="hourly-label-item" style="width: ${itemWidth}px;">
                    <div class="hourly-label-time">${timeStr}</div>
                    <div class="hourly-label-icon">${getWeatherEmojiForTime(h.code, h.time)}</div>
                    <div class="hourly-label-temp">${Math.round(h.temp)}°</div>
                </div>
            `;
        }).join('');
        
        container.innerHTML = `
            <div class="temp-chart-wrapper" style="width: ${totalWidth}px;">
                <div class="temp-chart">${svg}</div>
                <div class="hourly-labels" style="width: ${totalWidth}px;">${labels}</div>
            </div>
        `;
    }

    function showHourly(dayIdx){
        if(!weatherData?.hourly) return;
        const d = weatherData.daily;
        const h = weatherData.hourly;
        const target = d.time[dayIdx];
        
        const hours = [];
        const temps = [];
        
        for (let i = 0; i < h.time.length; i++) {
            if (h.time[i].startsWith(target)) {
                hours.push({
                    time: h.time[i],
                    temp: h.temperature_2m[i],
                    code: h.weather_code[i]
                });
                temps.push(h.temperature_2m[i]);
            }
        }
        
        if (!hours.length) return;
        
        hTitle.textContent = new Date(target).toLocaleDateString('ru-RU', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
        
        buildHourlyChart(hours, temps);
        
        fView.classList.add('hidden');
        hView.classList.add('active');
    }

    function updateUI(data, loc){
        weatherData = data;
        const cur = data.current;
        const d = data.daily;
        
        city.textContent = loc.main;
        region.textContent = loc.region;
        coords.textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        
        const code = cur.weather_code;
        temp.textContent = `${Math.round(cur.temperature_2m)}°`;
        feels.textContent = `Ощущается как ${Math.round(cur.apparent_temperature)}°`;
        desc.innerHTML = `${getWeatherEmojiHtml(code)} ${getWeatherDescription(code)}`;
        upd.textContent = `Обновлено: ${getCurrentTimeString()}`;
        updateBackground(code);
        
        fScroll.innerHTML = d.time.map((t, i) => {
            const dt = new Date(t);
            const name = i === 0 ? 'Сегодня' : dt.toLocaleDateString('ru-RU', { weekday: 'short' });
            const date = dt.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
            return `
                <div class="forecast-card" data-day="${i}">
                    <div class="forecast-day">${name}</div>
                    <div class="forecast-date">${date}</div>
                    <div class="forecast-icon">${getDayEmojiHtml(d.weather_code[i])}</div>
                    <div class="forecast-temp-max">${Math.round(d.temperature_2m_max[i])}°</div>
                    <div class="forecast-temp-min">${Math.round(d.temperature_2m_min[i])}°</div>
                </div>
            `;
        }).join('');
        
        document.querySelectorAll('.forecast-card').forEach(c =>
            c.addEventListener('click', () => showHourly(+c.dataset.day))
        );
    }

    async function loadWeatherData(forceRefresh = false){
        showLoading();
        try {
            const p = await requestLocation();
            lat = p.lat;
            lon = p.lon;
            const [loc, data] = await Promise.all([
                reverseGeocode(lat, lon),
                fetchWeatherData(lat, lon, forceRefresh)
            ]);
            updateUI(data, loc);
            showContent();
        } catch (e) {
            showError(e.message);
        }
    }

    window.loadWeatherData = loadWeatherData;
    backBtn.addEventListener('click', () => {
        fView.classList.remove('hidden');
        hView.classList.remove('active');
    });
    document.getElementById('refreshBtn').addEventListener('click', () => loadWeatherData(true));
    document.getElementById('errorRetryBtn').addEventListener('click', () => loadWeatherData(true));
    initTheme();
    initMenu();
    loadWeatherData();
})();