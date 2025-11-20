import { ApiService, WeatherApiResponse } from './apiservice.js';
import { MESSAGES, GEOLOCATION_ERROR_MESSAGES } from '../config/index.js';

interface WeatherData {
    temperature: number;
    description: string;
    city: string;
}

class WeatherService {

    static async loadWeather(): Promise<WeatherData> {
        const position = await ApiService.getUserLocation();
        const { latitude, longitude } = position.coords;
        const [cityName, weatherData] = await Promise.all([
            ApiService.fetchCityName(latitude, longitude),
            ApiService.fetchWeather(latitude, longitude)
        ]);
        const processed = this.processWeatherData(weatherData, cityName);
        return processed;
    }

    static processWeatherData(weatherData: WeatherApiResponse, city: string = MESSAGES.DEFAULT_CITY): WeatherData {
        return {
            temperature: Math.round(weatherData.current.temperature_2m),
            description: this.getWeatherDescription(weatherData.current.weather_code),
            city: city
        };
    }

    static getWeatherDescription(code: number): string {
        const weatherCodes: { [key: number]: string } = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Fog',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            80: 'Rain showers',
            95: 'Thunderstorm'
        };
        
        return weatherCodes[code] || MESSAGES.UNKNOWN_WEATHER;
    }

    static getWeatherIcon(description: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('clear')) return '☀️';
        if (desc.includes('cloud') || desc.includes('overcast')) return '☁️';
        if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
        if (desc.includes('snow')) return '❄️';
        if (desc.includes('thunderstorm')) return '⛈️';
        if (desc.includes('fog')) return '🌫️';
        return '🌤️';
    }

    static renderWeather(weather: WeatherData): string {
        const icon = this.getWeatherIcon(weather.description);
        const html = `
            <div class="weather-content">
                <div class="weather-icon">${icon}</div>
                <div class="weather-temp">${weather.temperature}°C</div>
                <div class="weather-city">${weather.city}</div>
            </div>
        `;
        return html;
    }

    static renderWeatherError(message: string): string {
        return `<div class="weather-error">${message}</div>`;
    }

    static getErrorMessage(error: unknown): string {
        if (!(error instanceof Error)) return MESSAGES.WEATHER_SERVICE_ERROR;
        
        if (error.name === 'GeolocationPositionError') {
            const geolocationError = error as unknown as GeolocationPositionError;
            switch (geolocationError.code) {
                case 1:
                    return GEOLOCATION_ERROR_MESSAGES.DENIED;
                case 2:
                    return GEOLOCATION_ERROR_MESSAGES.UNAVAILABLE;
                case 3:
                    return GEOLOCATION_ERROR_MESSAGES.TIMEOUT;
                default:
                    return GEOLOCATION_ERROR_MESSAGES.DEFAULT;
            }
        }
        
        const message = error.message;
        if (message.includes('Geolocation not supported')) {
            return GEOLOCATION_ERROR_MESSAGES.NOT_SUPPORTED;
        }
        if (message.includes('Weather API error')) {
            return GEOLOCATION_ERROR_MESSAGES.WEATHER_API_ERROR;
        }
        
        return GEOLOCATION_ERROR_MESSAGES.UNABLE_TO_LOAD;
    }
}

export { WeatherService };
export type { WeatherData };
