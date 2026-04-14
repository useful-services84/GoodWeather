(function(){
    "use strict";
    
    const loading = document.getElementById('loadingUI');
    const fView = document.getElementById('forecastView');
    const hView = document.getElementById('hourlyView');
    const errUI = document.getElementById('errorUI');
    const fScroll = document.getElementById('forecastScroll');
    const hScroll = document.getElementById('hourlyScroll');
    const hTitle = document.getElementById('hourlyTitle');
    const chart = document.getElementById('chartSvg');
    const backBtn = document.getElementById('backBtn');
    const city = document.getElementById('cityDisplay');
    const region = document.getElementById('regionDisplay');
    const coords = document.getElementById('coordsDisplay');
    const temp = document.getElementById('tempDisplay');
    const feels = document.getElementById('feelsLikeHeader');
    const desc = document.getElementById('descDisplay');
    const upd = document.getElementById('updateTimeDisplay');

    let lat, lon, weatherData;

    function showLoading() {
        loading.style.display = 'flex';
        fView.classList.add('hidden');
        hView.classList.remove('active');
        errUI.style.display = 'none';
    }
    
    function showContent() {
        loading.style.display = 'none';
        fView.classList.remove('hidden');
        hView.classList.remove('active');
        errUI.style.display = 'none';
    }
    
    function showError(m) {
        loading.style.display = 'none';
        fView.classList.add('hidden');
        hView.classList.remove('active');
        errUI.style.display = 'flex';
        document.getElementById('errorText').textContent = m;
    }

    function getDayEmojiHtml(code) {
        if (typeof emojiSet !== 'undefined' && emojiSet === 'fluent') {
            const f = (typeof FLUENT_SVG_MAP !== 'undefined' && FLUENT_SVG_MAP[code]) || 'Cloud.svg';
            return '<img src="emoji/' + f + '" class="weather-icon" onerror="this.style.display=\'none\'">';
        }
        return (typeof SYSTEM_EMOJIS !== 'undefined' && SYSTEM_EMOJIS[code]) || '🌡️';
    }

    function drawChart(temps, hoursCount) {
        if (!chart || !temps.length) return;
        
        var pointWidth = 70;
        var totalWidth = hoursCount * pointWidth;
        
        chart.setAttribute('viewBox', '0 0 ' + totalWidth + ' 150');
        
        var pad = 45;
        var h = 150;
        var max = Math.max.apply(null, temps);
        var min = Math.min.apply(null, temps);
        var r = max - min || 1;
        
        var pts = temps.map(function(t, i) {
            return {
                x: pad + (i / (temps.length - 1)) * (totalWidth - 2 * pad),
                y: h - pad - ((t - min) / r) * (h - 2 * pad)
            };
        });
        
        var path = 'M ' + pts[0].x + ' ' + pts[0].y;
        for (var i = 1; i < pts.length; i++) {
            path += ' L ' + pts[i].x + ' ' + pts[i].y;
        }
        
        var circles = '', labels = '';
        pts.forEach(function(p, i) {
            circles += '<circle cx="' + p.x + '" cy="' + p.y + '" r="5" class="chart-point"/>';
            labels += '<text x="' + p.x + '" y="' + (p.y - 10) + '" class="chart-label">' + Math.round(temps[i]) + '°</text>';
        });
        
        chart.innerHTML = '<path d="' + path + '" class="chart-line"/>' + circles + labels;
        
        var wrapper = document.querySelector('.hourly-scroll-wrapper');
        var chartDiv = wrapper.querySelector('.temp-chart');
        var scrollDiv = wrapper.querySelector('.hourly-scroll');
        
        chartDiv.style.width = totalWidth + 'px';
        chartDiv.style.minWidth = totalWidth + 'px';
        scrollDiv.style.width = totalWidth + 'px';
        scrollDiv.style.minWidth = totalWidth + 'px';
    }

    function showHourly(dayIdx) {
        if (!weatherData || !weatherData.hourly) return;
        
        var d = weatherData.daily;
        var h = weatherData.hourly;
        var target = d.time[dayIdx];
        var hours = [], temps = [];
        
        for (var i = 0; i < h.time.length; i++) {
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
        
        hScroll.innerHTML = hours.map(function(o) {
            var hour = new Date(o.time).getHours();
            return '<div class="hourly-card" style="width: 70px;">' +
                '<div class="hourly-time">' + hour + ':00</div>' +
                '<div class="hourly-icon">' + (typeof getWeatherEmojiForTime === 'function' ? getWeatherEmojiForTime(o.code, o.time) : '') + '</div>' +
                '<div class="hourly-temp">' + Math.round(o.temp) + '°</div>' +
            '</div>';
        }).join('');
        
        drawChart(temps, hours.length);
        
        fView.classList.add('hidden');
        hView.classList.add('active');
    }

    function updateUI(data, loc) {
        weatherData = data;
        var cur = data.current;
        var d = data.daily;
        
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
        
        fScroll.innerHTML = d.time.map(function(t, i) {
            var dt = new Date(t);
            var name = i === 0 ? 'Сегодня' : dt.toLocaleDateString('ru-RU', {weekday: 'short'});
            var date = dt.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'});
            return '<div class="forecast-card" data-day="' + i + '">' +
                '<div class="forecast-day">' + name + '</div>' +
                '<div class="forecast-date">' + date + '</div>' +
                '<div class="forecast-icon">' + getDayEmojiHtml(d.weather_code[i]) + '</div>' +
                '<div class="forecast-temp-max">' + Math.round(d.temperature_2m_max[i]) + '°</div>' +
                '<div class="forecast-temp-min">' + Math.round(d.temperature_2m_min[i]) + '°</div>' +
            '</div>';
        }).join('');
        
        var cards = document.querySelectorAll('.forecast-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].addEventListener('click', (function(idx) {
                return function(e) {
                    e.stopPropagation();
                    showHourly(idx);
                };
            })(i));
        }
    }

    async function loadWeatherData(forceRefresh) {
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
                fetchWeatherData(lat, lon, forceRefresh)
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
    
    if (backBtn) {
        backBtn.addEventListener('click', function() {
            fView.classList.remove('hidden');
            hView.classList.remove('active');
        });
    }
    
    var refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            loadWeatherData(true);
        });
    }
    
    var errorRetryBtn = document.getElementById('errorRetryBtn');
    if (errorRetryBtn) {
        errorRetryBtn.addEventListener('click', function() {
            loadWeatherData(true);
        });
    }
    
    if (typeof initTheme === 'function') initTheme();
    if (typeof initMenu === 'function') initMenu();
    
    loadWeatherData();
})();