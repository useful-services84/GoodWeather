(function(){
    const loading = document.getElementById('loadingUI');
    const content = document.getElementById('detailsContent');
    const errorUI = document.getElementById('errorUI');

    const city = document.getElementById('cityDisplay');
    const region = document.getElementById('regionDisplay');
    const coords = document.getElementById('coordsDisplay');
    const temp = document.getElementById('tempDisplay');
    const feels = document.getElementById('feelsLikeHeader');
    const desc = document.getElementById('descDisplay');
    const update = document.getElementById('updateTimeDisplay');

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
        loading.style.display = 'flex'; content.style.display = 'none'; errorUI.style.display = 'none';
    }
    function showContent() {
        loading.style.display = 'none'; content.style.display = 'block'; errorUI.style.display = 'none';
    }
    function showError(m) {
        loading.style.display = 'none'; content.style.display = 'none'; errorUI.style.display = 'flex';
        document.getElementById('errorText').textContent = m;
    }

    function updateUI(data, loc) {
        const cur = data.current, daily = data.daily;
        city.textContent = loc.main; region.textContent = loc.region; coords.textContent = `${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        const code = cur.weather_code;
        temp.textContent = `${Math.round(cur.temperature_2m)}°`;
        feels.textContent = `Ощущается как ${Math.round(cur.apparent_temperature)}°`;
        desc.innerHTML = `${getWeatherEmojiHtml(code)} ${getWeatherDescription(code)}`;
        update.textContent = `Обновлено: ${getCurrentTimeString()}`;
        updateBackground(code);

        fLike.textContent = Math.round(cur.apparent_temperature);
        hum.textContent = Math.round(cur.relative_humidity_2m);
        wSpeed.textContent = cur.wind_speed_10m.toFixed(1);
        wDir.textContent = getWindDirection(cur.wind_direction_10m);
        wGust.textContent = cur.wind_gusts_10m?.toFixed(1) || '—';
        cloud.textContent = Math.round(cur.cloud_cover);
        vis.textContent = (cur.visibility / 1000).toFixed(1);
        press.textContent = hPaToMmHg(cur.surface_pressure);
        precip.textContent = cur.precipitation?.toFixed(1) || '0.0';
        sunrise.textContent = formatTime(daily.sunrise[0]);
        sunset.textContent = formatTime(daily.sunset[0]);
    }

    async function loadData() {
        showLoading();
        try {
            const pos = await requestLocation();
            lat = pos.lat; lon = pos.lon;
            const [loc, data] = await Promise.all([reverseGeocode(lat, lon), fetchWeatherData(lat, lon)]);
            updateUI(data, loc);
            showContent();
        } catch (e) {
            showError(e.message);
        }
    }

    document.getElementById('refreshBtn').addEventListener('click', loadData);
    document.getElementById('errorRetryBtn').addEventListener('click', loadData);
    initTheme();
    initMenu();
    loadData();
})();