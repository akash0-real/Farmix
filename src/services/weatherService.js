let geocodeApiUrl = 'https://geocoding-api.open-meteo.com/v1/search';
let weatherApiUrl = 'https://api.open-meteo.com/v1/forecast';

try {
  // Keep local endpoints/keys in src/config/localSecrets.js (gitignored).
  // eslint-disable-next-line global-require, import/no-unresolved
  const localSecrets = require('../config/localSecrets');
  geocodeApiUrl = localSecrets.WEATHER_GEOCODE_API_URL || geocodeApiUrl;
  weatherApiUrl = localSecrets.WEATHER_FORECAST_API_URL || weatherApiUrl;
} catch (error) {
  // Use safe public defaults when local secret file is missing.
}

function buildLocationCandidates({ village, district, state }) {
  const parts = {
    village: String(village || '').trim(),
    district: String(district || '').trim(),
    state: String(state || '').trim(),
  };

  const candidates = [
    {
      query: [parts.village, parts.district, parts.state, 'India'].filter(Boolean).join(', '),
      preferredName: parts.village,
    },
    {
      query: [parts.village, parts.state, 'India'].filter(Boolean).join(', '),
      preferredName: parts.village,
    },
    {
      query: [parts.village, 'India'].filter(Boolean).join(', '),
      preferredName: parts.village,
    },
    {
      query: [parts.district, 'district', parts.state, 'India'].filter(Boolean).join(', '),
      preferredName: parts.district,
    },
    {
      query: [parts.district, parts.state, 'India'].filter(Boolean).join(', '),
      preferredName: parts.district,
    },
    {
      query: [parts.state, 'India'].filter(Boolean).join(', '),
      preferredName: parts.state,
    },
  ].filter(item => item.query);

  const deduped = [];
  const seen = new Set();
  for (const item of candidates) {
    const key = item.query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
  }
  return deduped;
}

const STATE_COORDINATES = {
  'andhra pradesh': { latitude: 15.9129, longitude: 79.74, name: 'Andhra Pradesh' },
  'arunachal pradesh': { latitude: 28.218, longitude: 94.7278, name: 'Arunachal Pradesh' },
  assam: { latitude: 26.2006, longitude: 92.9376, name: 'Assam' },
  bihar: { latitude: 25.0961, longitude: 85.3131, name: 'Bihar' },
  chhattisgarh: { latitude: 21.2787, longitude: 81.8661, name: 'Chhattisgarh' },
  goa: { latitude: 15.2993, longitude: 74.124, name: 'Goa' },
  gujarat: { latitude: 22.2587, longitude: 71.1924, name: 'Gujarat' },
  haryana: { latitude: 29.0588, longitude: 76.0856, name: 'Haryana' },
  'himachal pradesh': { latitude: 31.1048, longitude: 77.1734, name: 'Himachal Pradesh' },
  jharkhand: { latitude: 23.61, longitude: 85.2799, name: 'Jharkhand' },
  karnataka: { latitude: 15.3173, longitude: 75.7139, name: 'Karnataka' },
  kerala: { latitude: 10.8505, longitude: 76.2711, name: 'Kerala' },
  'madhya pradesh': { latitude: 22.9734, longitude: 78.6569, name: 'Madhya Pradesh' },
  maharashtra: { latitude: 19.7515, longitude: 75.7139, name: 'Maharashtra' },
  manipur: { latitude: 24.6637, longitude: 93.9063, name: 'Manipur' },
  meghalaya: { latitude: 25.467, longitude: 91.3662, name: 'Meghalaya' },
  mizoram: { latitude: 23.1645, longitude: 92.9376, name: 'Mizoram' },
  nagaland: { latitude: 26.1584, longitude: 94.5624, name: 'Nagaland' },
  odisha: { latitude: 20.9517, longitude: 85.0985, name: 'Odisha' },
  punjab: { latitude: 31.1471, longitude: 75.3412, name: 'Punjab' },
  rajasthan: { latitude: 27.0238, longitude: 74.2179, name: 'Rajasthan' },
  sikkim: { latitude: 27.533, longitude: 88.5122, name: 'Sikkim' },
  'tamil nadu': { latitude: 11.1271, longitude: 78.6569, name: 'Tamil Nadu' },
  telangana: { latitude: 18.1124, longitude: 79.0193, name: 'Telangana' },
  tripura: { latitude: 23.9408, longitude: 91.9882, name: 'Tripura' },
  'uttar pradesh': { latitude: 26.8467, longitude: 80.9462, name: 'Uttar Pradesh' },
  uttarakhand: { latitude: 30.0668, longitude: 79.0193, name: 'Uttarakhand' },
  'west bengal': { latitude: 22.9868, longitude: 87.855, name: 'West Bengal' },
};

function getStateFallbackCoordinates(state) {
  const key = String(state || '').trim().toLowerCase();
  return STATE_COORDINATES[key] || null;
}

export function mapWeatherCodeToKey(code) {
  const value = Number(code);

  if (value === 0) return 'weatherClearSky';
  if ([1, 2].includes(value)) return 'weatherPartlyCloudy';
  if (value === 3) return 'weatherCloudy';
  if ([45, 48].includes(value)) return 'weatherFog';
  if ([51, 53, 55, 56, 57].includes(value)) return 'weatherDrizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(value)) return 'weatherRain';
  if ([71, 73, 75, 77, 85, 86].includes(value)) return 'weatherSnow';
  if ([95, 96, 99].includes(value)) return 'weatherThunderstorm';
  return 'weatherUnknown';
}

function scoreGeocodeResult(result, preferredName) {
  const name = String(result?.name || '').toLowerCase();
  const admin1 = String(result?.admin1 || '').toLowerCase();
  const admin2 = String(result?.admin2 || '').toLowerCase();
  const preferred = String(preferredName || '').trim().toLowerCase();

  let score = 0;

  if (String(result?.country_code || '').toUpperCase() === 'IN') {
    score += 20;
  }

  if (!preferred) {
    return score;
  }

  if (name === preferred) {
    score += 120;
  } else if (name.includes(preferred)) {
    score += 60;
  }

  if (admin2 === preferred) {
    score += 40;
  } else if (admin2.includes(preferred)) {
    score += 20;
  }

  if (admin1 === preferred) {
    score += 10;
  }

  return score;
}

async function geocodeLocation(query, preferredName) {
  const url = `${geocodeApiUrl}?name=${encodeURIComponent(query)}&count=5&language=en&format=json`;
  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.reason || 'Geocoding failed.');
  }

  const results = Array.isArray(data?.results) ? data.results : [];
  if (!results.length) {
    return null;
  }

  const ranked = [...results].sort(
    (a, b) => scoreGeocodeResult(b, preferredName) - scoreGeocodeResult(a, preferredName),
  );

  return ranked[0] || null;
}

async function fetchCurrentWeather(latitude, longitude) {
  const url =
    `${weatherApiUrl}?latitude=${latitude}&longitude=${longitude}` +
    '&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m' +
    '&timezone=auto';

  const response = await fetch(url);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.reason || 'Weather fetch failed.');
  }

  return data?.current || null;
}

export async function fetchWeatherByLocation({ village, district, state }) {
  const candidates = buildLocationCandidates({ village, district, state });
  if (!candidates.length) {
    throw new Error('Location is not available yet.');
  }

  let place = null;
  for (const candidate of candidates) {
    // eslint-disable-next-line no-await-in-loop
    place = await geocodeLocation(candidate.query, candidate.preferredName);
    if (place) break;
  }

  if (!place) {
    const stateFallback = getStateFallbackCoordinates(state);
    if (!stateFallback) {
      throw new Error('Location not found for weather lookup.');
    }

    place = {
      name: stateFallback.name,
      admin1: 'India',
      latitude: stateFallback.latitude,
      longitude: stateFallback.longitude,
    };
  }

  const current = await fetchCurrentWeather(place.latitude, place.longitude);
  if (!current) {
    throw new Error('Weather data is unavailable.');
  }

  return {
    locationName: `${place.name}${place.admin1 ? `, ${place.admin1}` : ''}`,
    latitude: place.latitude,
    longitude: place.longitude,
    temperatureC: current.temperature_2m,
    feelsLikeC: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    precipitationMm: current.precipitation,
    windKmh: current.wind_speed_10m,
    weatherCode: current.weather_code,
    conditionKey: mapWeatherCodeToKey(current.weather_code),
  };
}
