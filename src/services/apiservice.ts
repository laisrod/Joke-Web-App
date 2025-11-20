import { API_URLS, API_HEADERS, GEOLOCATION_CONFIG, WEATHER_API_PARAMS } from '../config/index.js';

interface DadJokeResponse {
    joke: string;
}

interface ChuckNorrisResponse {
    value: string;
}

interface WeatherApiResponse {
    current: {
        temperature_2m: number;
        weather_code: number;
    };
}

interface GeocodingResponse {
    city?: string;
    locality?: string;
    principalSubdivision?: string;
    countryName?: string;
    localityInfo?: {
        administrative?: Array<{
            name: string;
            order: number;
        }>;
    };
}

async function fetchData<T>(
    url: string, 
    apiName: string, 
    options?: RequestInit
): Promise<T> {
    const response = await fetch(url, options);

    if (!response.ok) {
        throw new Error(`${apiName} API error: ${response.status}`);
    }

    return await response.json();
}

async function fetchDadJoke(): Promise<string> {
    const data = await fetchData<DadJokeResponse>(
        API_URLS.DAD_JOKES,
        'Dad joke',
        { headers: API_HEADERS.DAD_JOKES }
    );
    return data.joke;
}

async function fetchChuckNorrisJoke(): Promise<string> {
    const data = await fetchData<ChuckNorrisResponse>(
        API_URLS.CHUCK_NORRIS,
        'Chuck Norris'
    );
    return data.value;
}

async function fetchWeather(latitude: number, longitude: number): Promise<WeatherApiResponse> {
    const url = `${API_URLS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=${WEATHER_API_PARAMS.CURRENT}&timezone=${WEATHER_API_PARAMS.TIMEZONE}`;
    return await fetchData<WeatherApiResponse>(url, 'Weather');
}

async function fetchCityName(latitude: number, longitude: number): Promise<string> {
    const url = `${API_URLS.GEOCODING}?${new URLSearchParams({
        latitude: latitude.toString(),
        longitude: longitude.toString(),
        localityLanguage: 'en'
    })}`;
    
    const data = await fetchData<GeocodingResponse>(
        url,
        'Geocoding',
        { headers: { 'Accept': 'application/json' } }
    );
    
    return data.city 
        || data.locality
        || data.localityInfo?.administrative?.find(a => a.order === 6)?.name
        || data.localityInfo?.administrative?.find(a => a.order === 4)?.name
        || data.principalSubdivision
        || 'Unknown location';
}

function getUserLocation(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation not supported'));
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => resolve(position),
            (error) => reject(error),
            {
                timeout: GEOLOCATION_CONFIG.TIMEOUT,
                enableHighAccuracy: GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
                maximumAge: GEOLOCATION_CONFIG.MAXIMUM_AGE
            }
        );
    });
}

export const ApiService = {
    fetchDadJoke,
    fetchChuckNorrisJoke,
    fetchWeather,
    fetchCityName,
    getUserLocation
};

export type { WeatherApiResponse };

