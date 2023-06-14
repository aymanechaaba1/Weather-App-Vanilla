'use strict';

const API_KEY = ''; // Your OpenWeatherMap API_KEY
const MAPBOX_ACCESS_TOKEN = ''; // Your Mapbox Access Token

const statsContainer = document.querySelector('.stats');
const tempContainer = document.querySelector('.temp-status');
const cityLabel = document.querySelector('.location');
const timeLabel = document.querySelector('.time');
const searchInput = document.querySelector('.search-input');
const searchForm = document.querySelector('.form');

const getJSON = async function (url, errorMsg = 'Something went wrong!') {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${errorMsg} (${res.status}) 💥💥💥`);

    const data = res.json();
    return data;
  } catch (err) {
    throw err;
  }
};

const geoCode = async function (searchText = '') {
  try {
    const data = await getJSON(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${searchText}.json?access_token=${MAPBOX_ACCESS_TOKEN}`,
      'Failed Geocoding!'
    );

    return data.features[0].center;
  } catch (err) {
    throw err;
  }
};

const reverseGeocode = async function (lat, long) {
  try {
    const data = await getJSON(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${long},${lat}.json?access_token=${MAPBOX_ACCESS_TOKEN}`,
      'Failed Reverse Geocoding :('
    );
    return data.features[0];
  } catch (err) {
    throw err;
  }
};

const getWeatherData = async function (lat, long, units = 'metric') {
  try {
    const data = await getJSON(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${long}&units=${units}&appid=${API_KEY}`,
      'Something went wrong getting weather data!'
    );

    const { current, timezone } = data;

    const cleanData = {
      clouds: current.clouds,
      dt: current.dt,
      timezone,
      dewPoint: current.dew_point,
      feelsLike: current.feels_like,
      humidity: current.humidity,
      pressure: current.pressure,
      sunrise: current.sunrise * 1000,
      sunset: current.sunset * 1000,
      temp: current.temp,
      uvi: current.uvi,
      visibility: current.visibility,
      weather: current.weather[0],
      windDeg: current.wind_deg,
      windGust: current.wind_gust,
      windSpeed: current.wind_speed,
    };

    return cleanData;
  } catch (err) {
    throw err;
  }
};

const renderStats = function (data) {
  const markup = `
    <div class="card clouds">
      <h4>Clouds</h4>
      <div class="val clouds-val">${formatUnit(data.clouds, 'percent')}</div>
    </div>
    <div class="card dewPoint">
      <h4>dew Point</h4>
      <div class="val dew-point-val">${formatUnit(
        data.dewPoint,
        'celsius'
      )}</div>
    </div>
    <div class="card feelsLike">
      <h4>feels Like</h4>
      <div class="val feels-like-val">${formatUnit(
        data.feelsLike,
        'celsius'
      )}</div>
    </div>
    <div class="card humidity">
      <h4>Humidity</h4>
      <div class="val humidity-val">${formatUnit(
        data.humidity,
        'percent'
      )}</div>
    </div>
    <div class="card pressure">
      <h4>Pressure</h4>
      <div class="val pressure-val">${data.pressure} hPa</div>
    </div>
    <div class="card uvi">
      <h4>UVI</h4>
      <div class="val uvi-val">${data.uvi}</div>
    </div>
    <div class="card wind-deg">
      <h4>Wind Deg</h4>
      <div class="val wind-deg-val">${formatUnit(
        data.windDeg,
        'degree',
        'narrow'
      )}</div>
    </div>
    <div class="card wind-speed">
      <h4>Wind Speed</h4>
      <div class="val wind-speed-val">${formatUnit(
        data.windSpeed,
        'meter-per-second'
      )}</div>
    </div>
  `;
  statsContainer.innerHTML = '';
  statsContainer.insertAdjacentHTML('afterbegin', markup);
};

const renderTemp = function (data) {
  const tempMarkup = `
    <div class="temp">
      <img src="https://openweathermap.org/img/wn/${data.weather.icon}@2x.png">
      <div class="temp-val">${formatUnit(data.temp, 'celsius')}</div>
      <div class="desc">${data.weather.description}</div>
      <div class="status">${data.weather.main}</div>
    </div>
    <div class="sunrise-sunset">
      <div class="sunrise">
        <ion-icon name="sunny" class="sunrise-icon"></ion-icon>
        <h4>Sunrise</h4>
        <div class="sunrise-val">${formatTime(new Date(data.sunrise))}</div>
      </div>
      <div class="sunset">
        <ion-icon name="partly-sunny" class="sunset-icon"></ion-icon>
        <h4>Sunset</h4>
        <div class="sunset-val">${formatTime(new Date(data.sunset))}</div>
      </div>
    </div>
  `;
  tempContainer.innerHTML = '';
  tempContainer.insertAdjacentHTML('afterbegin', tempMarkup);
};

// Helper Functions
const formatUnit = (val, unit, unitDisplay) =>
  new Intl.NumberFormat(navigator.location, {
    style: 'unit',
    unit,
    unitDisplay,
  }).format(val);

const formatTime = (time) =>
  new Intl.DateTimeFormat(navigator.location, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(time);

const formatDate = (date) =>
  new Intl.DateTimeFormat(navigator.location, {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

const getCity = (str) => str.split(',')[2];

// Init State
const init = function () {
  cityLabel.textContent = '';
  timeLabel.textContent = '';
  statsContainer.innerHTML = '';
  tempContainer.innerHTML = '';
};

init();

// Display weather of user's location
navigator.geolocation.getCurrentPosition(async (pos) => {
  // Get lat&long of user's location
  const { latitude: lat, longitude: long } = pos.coords;

  // Reverse Geocode (Get city name)
  const { place_name: placeName } = await reverseGeocode(lat, long);

  // Display city and current date&time
  cityLabel.textContent = getCity(placeName);
  timeLabel.textContent = formatDate(new Date());

  // Get Stats data
  const data = await getWeatherData(lat, long);

  // Render Stats
  renderStats(data);

  // Render Temp
  renderTemp(data);
});

// Log Weather data of searched location
searchForm.addEventListener('submit', async (e) => {
  try {
    e.preventDefault();

    // 1. Get city name from input field
    const searchedCity = searchInput.value;

    // Guard clause
    if (!searchedCity) return;

    // Clear input field
    searchInput.value = '';

    // Geocode (Get lat,long)
    const [long, lat] = await geoCode(searchedCity);

    // Update city name
    cityLabel.textContent = `${searchedCity[0].toUpperCase()}${searchedCity
      .toLowerCase()
      .slice(1)}`;

    // Get weather data of the searched
    const data = await getWeatherData(lat, long);

    // Render Stats
    renderStats(data);

    // Render Temp
    renderTemp(data);
  } catch (err) {
    console.error(err.message);
  }
});
