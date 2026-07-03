// Weather service using OpenWeatherMap API
// To use this service, create a .env file in the frontend root with:
// NEXT_PUBLIC_OPENWEATHER_API_KEY=your_actual_api_key_here
const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || '657c13238d19faa09c854dfe2b21f7df';
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Hindi translations for weather conditions
const weatherTranslations = {
  'clear sky': 'साफ आसमान',
  'few clouds': 'हल्के बादल',
  'scattered clouds': 'बिखरे बादल',
  'broken clouds': 'टूटे बादल',
  'shower rain': 'बारिश',
  'rain': 'बारिश',
  'thunderstorm': 'आंधी',
  'snow': 'बर्फ',
  'mist': 'कोहरा',
  'fog': 'धुंध',
  'haze': 'धुआं',
  'dust': 'धूल',
  'sand': 'रेत',
  'ash': 'राख',
  'squall': 'तूफान',
  'tornado': 'बवंडर'
};

// Default location (New Delhi)
const DEFAULT_LOCATION = {
  lat: 28.6139,
  lon: 77.2090,
  name: 'नई दिल्ली'
};

// Get user's current location
export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      () => {
        // Fallback to default location
        resolve(DEFAULT_LOCATION);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000 // 10 minutes
      }
    );
  });
};

// Get weather data by coordinates
export const getWeatherByCoords = async (lat, lon) => {
  try {
    // Validate API key
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      throw new Error('OpenWeatherMap API key not configured. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in your .env file');
    }

    const url = `${BASE_URL}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=hi`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key in the .env file');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later');
      } else if (response.status === 404) {
        throw new Error('Location not found');
      } else {
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    return formatWeatherData(data);
  } catch (error) {
    throw error;
  }
};

// Get weather data by city name
export const getWeatherByCity = async (cityName) => {
  try {
    // Validate API key
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      throw new Error('OpenWeatherMap API key not configured. Please set NEXT_PUBLIC_OPENWEATHER_API_KEY in your .env file');
    }

    const url = `${BASE_URL}/weather?q=${cityName}&appid=${API_KEY}&units=metric&lang=hi`;
    
    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenWeatherMap API key in the .env file');
      } else if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later');
      } else if (response.status === 404) {
        throw new Error('City not found');
      } else {
        throw new Error(`Weather API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    return formatWeatherData(data);
  } catch (error) {
    throw error;
  }
};

// Format weather data for display
const formatWeatherData = (data) => {
  const condition = data.weather[0].description.toLowerCase();
  const translatedCondition = weatherTranslations[condition] || condition;

  return {
    city: data.name || 'नई दिल्ली',
    temperature: `${Math.round(data.main.temp)}°C`,
    condition: translatedCondition,
    humidity: `${data.main.humidity}%`,
    wind: `${Math.round(data.wind.speed * 3.6)} किमी/घंटा`, // Convert m/s to km/h
    feelsLike: `${Math.round(data.main.feels_like)}°C`,
    pressure: `${data.main.pressure} hPa`,
    visibility: data.visibility ? `${(data.visibility / 1000).toFixed(1)} km` : 'N/A',
    icon: data.weather[0].icon,
    description: data.weather[0].description,
    sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString('hi-IN', {
      hour: '2-digit',
      minute: '2-digit'
    }),
    sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString('hi-IN', {
      hour: '2-digit',
      minute: '2-digit'
    })
  };
};

// Main function to get current weather
export const getCurrentWeather = async () => {
  try {
    const location = await getCurrentLocation();
    const weather = await getWeatherByCoords(location.lat, location.lon);
    return weather;
  } catch {
    // Fallback to default location
    try {
      const fallbackWeather = await getWeatherByCoords(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      return fallbackWeather;
    } catch {
      // Return mock data as final fallback
      return {
        city: 'नई दिल्ली',
        temperature: '28°C',
        condition: 'धूप',
        humidity: '65%',
        wind: '12 किमी/घंटा',
        feelsLike: '30°C',
        pressure: '1013 hPa',
        visibility: '10 km'
      };
    }
  }
};

// Test API key function
export const testApiKey = async () => {
  try {
    if (!API_KEY || API_KEY === 'YOUR_OPENWEATHER_API_KEY') {
      throw new Error('API key not configured');
    }

    const testUrl = `${BASE_URL}/weather?q=London&appid=${API_KEY}&units=metric`;
    
    const response = await fetch(testUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `API test failed: ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Get weather forecast (5-day forecast)
export const getWeatherForecast = async (lat, lon) => {
  try {
    const response = await fetch(
      `${BASE_URL}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=hi`
    );

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status}`);
    }

    const data = await response.json();
    return data.list.map(item => ({
      date: new Date(item.dt * 1000).toLocaleDateString('hi-IN'),
      time: new Date(item.dt * 1000).toLocaleTimeString('hi-IN', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      temperature: `${Math.round(item.main.temp)}°C`,
      condition: weatherTranslations[item.weather[0].description.toLowerCase()] || item.weather[0].description,
      humidity: `${item.main.humidity}%`,
      wind: `${Math.round(item.wind.speed * 3.6)} किमी/घंटा`,
      icon: item.weather[0].icon
    }));
  } catch (error) {
    throw error;
  }
};
