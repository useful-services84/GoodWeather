(function(){
    const loading=document.getElementById('loadingUI'),
          fView=document.getElementById('forecastView'),
          hView=document.getElementById('hourlyView'),
          errUI=document.getElementById('errorUI'),
          fScroll=document.getElementById('forecastScroll'),
          hScroll=document.getElementById('hourlyScroll'),
          hTitle=document.getElementById('hourlyTitle'),
          chart=document.getElementById('chartSvg'),
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

    function drawChart(temps, hoursCount){
        if(!chart||!temps.length)return;
        const pointWidth = 70;
        const totalWidth = Math.max(hoursCount * pointWidth, 600);
        chart.setAttribute('viewBox', `0 0 ${totalWidth} 150`);
        
        const pad = 45;
        const h = 150;
        const max = Math.max(...temps);
        const min = Math.min(...temps);
        const r = max - min || 1;
        
        const pts = temps.map((t, i) => ({
            x: pad + (i / (temps.length - 1)) * (totalWidth - 2 * pad),
            y: h - pad - ((t - min) / r) * (h - 2 * pad)
        }));
        
        let path = `M ${pts[0].x} ${pts[0].y}`;
        for(let i = 1; i < pts.length; i++) path += ` L ${pts[i].x} ${pts[i].y}`;
        
        let circles = '', labels = '';
        pts.forEach((p, i) => {
            circles += `<circle cx="${p.x}" cy="${p.y}" r="5" class="chart-point"/>`;
            labels += `<text x="${p.x}" y="${p.y - 10}" class="chart-label">${Math.round(temps[i])}°</text>`;
        });
        
        chart.innerHTML = `<path d="${path}" class="chart-line"/>${circles}${labels}`;
        
        // Подгоняем ширину контейнера и скролла
        const container = document.querySelector('.hourly-scroll-container');
        const chartDiv = container.querySelector('.temp-chart');
        chartDiv.style.minWidth = totalWidth + 'px';
        hScroll.style.minWidth = totalWidth + 'px';
    }

    function showHourly(dayIdx){
        if(!weatherData?.hourly)return;
        const d = weatherData.daily, h = weatherData.hourly, target = d.time[dayIdx];
        const hours = [], temps = [];
        
        for(let i = 0; i < h.time.length; i++) {
            if(h.time[i].startsWith(target)){
                hours.push({
                    time: h.time[i],
                    temp: h.temperature_2m[i],
                    code: h.weather_code[i]
                });
                temps.push(h.temperature_2m[i]);
            }
        }
        if(!hours.length)return;
        
        hTitle.textContent = new Date(target).toLocaleDateString('ru-RU', {
            weekday: 'long', day: 'numeric', month: 'long'
        });
        
        hScroll.innerHTML = hours.map(o => {
            const hour = new Date(o.time).getHours();
            return `
                <div class="hourly-card" style="width: 70px;">
                    <div class="hourly-time">${hour}:00</div>
                    <div class="hourly-icon">${getWeatherEmojiForTime(o.code, o.time)}</div>
                    <div class="hourly-temp">${Math.round(o.temp)}°</div>
                </div>
            `;
        }).join('');
        
        drawChart(temps, hours.length);
        
        fView.classList.add('hidden');
        hView.classList.add('active');
    }

    function updateUI(data, loc){
        weatherData = data;
        const cur = data.current, d = data.daily;
        
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
            const name = i === 0 ? 'Сегодня' : dt.toLocaleDateString('ru-RU', {weekday: 'short'});
            const date = dt.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
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
        try{
            const p = await requestLocation();
            lat = p.lat; lon = p.lon;
            const [loc, data] = await Promise.all([
                reverseGeocode(lat, lon),
                fetchWeatherData(lat, lon, forceRefresh)
            ]);
            updateUI(data, loc);
            showContent();
        }catch(e){
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