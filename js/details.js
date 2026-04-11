(function(){
    const loading=document.getElementById('loadingUI'),
          content=document.getElementById('detailsContent'),
          errUI=document.getElementById('errorUI'),
          city=document.getElementById('cityDisplay'),
          region=document.getElementById('regionDisplay'),
          coords=document.getElementById('coordsDisplay'),
          temp=document.getElementById('tempDisplay'),
          feels=document.getElementById('feelsLikeHeader'),
          desc=document.getElementById('descDisplay'),
          upd=document.getElementById('updateTimeDisplay'),
          fLike=document.getElementById('feelsLikeDisplay'),
          hum=document.getElementById('humidityDisplay'),
          wSpeed=document.getElementById('windSpeedDisplay'),
          wDir=document.getElementById('windDirDisplay'),
          wGust=document.getElementById('windGustDisplay'),
          cloud=document.getElementById('cloudDisplay'),
          vis=document.getElementById('visibilityDisplay'),
          press=document.getElementById('pressureDisplay'),
          precip=document.getElementById('precipDisplay'),
          sunrise=document.getElementById('sunriseDisplay'),
          sunset=document.getElementById('sunsetDisplay');

    let lat,lon;

    function showLoading(){loading.style.display='flex'; content.style.display='none'; errUI.style.display='none';}
    function showContent(){loading.style.display='none'; content.style.display='block'; errUI.style.display='none';}
    function showError(m){loading.style.display='none'; content.style.display='none'; errUI.style.display='flex'; document.getElementById('errorText').textContent=m;}

    function updateUI(data,loc){
        const cur=data.current, daily=data.daily;
        city.textContent=loc.main; region.textContent=loc.region; coords.textContent=`${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
        const code=cur.weather_code;
        temp.textContent=`${Math.round(cur.temperature_2m)}°`;
        feels.textContent=`Ощущается как ${Math.round(cur.apparent_temperature)}°`;
        desc.innerHTML=`${getWeatherEmojiHtml(code)} ${getWeatherDescription(code)}`;
        upd.textContent=`Обновлено: ${getCurrentTimeString()}`;
        updateBackground(code);
        fLike.textContent=Math.round(cur.apparent_temperature);
        hum.textContent=Math.round(cur.relative_humidity_2m);
        wSpeed.textContent=cur.wind_speed_10m.toFixed(1);
        wDir.textContent=getWindDirection(cur.wind_direction_10m);
        wGust.textContent=cur.wind_gusts_10m?.toFixed(1)||'—';
        cloud.textContent=Math.round(cur.cloud_cover);
        vis.textContent=(cur.visibility/1000).toFixed(1);
        press.textContent=hPaToMmHg(cur.surface_pressure);
        precip.textContent=cur.precipitation?.toFixed(1)||'0.0';
        sunrise.textContent=formatTime(daily.sunrise[0]);
        sunset.textContent=formatTime(daily.sunset[0]);
    }

    async function loadWeatherData(){
        showLoading();
        try{
            const p=await requestLocation(); lat=p.lat; lon=p.lon;
            const [loc, data] = await Promise.all([reverseGeocode(lat,lon), fetchWeatherData(lat,lon)]);
            updateUI(data,loc); showContent();
        }catch(e){showError(e.message);}
    }

    window.loadWeatherData = loadWeatherData;
    document.getElementById('refreshBtn').addEventListener('click',loadWeatherData);
    document.getElementById('errorRetryBtn').addEventListener('click',loadWeatherData);
    initTheme(); initMenu(); loadWeatherData();
})();