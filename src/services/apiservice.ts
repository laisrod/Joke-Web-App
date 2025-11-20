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

class ApiService {
    static async fetchDadJoke(): Promise<string> {
        const response = await fetch(API_URLS.DAD_JOKES, {
            headers: API_HEADERS.DAD_JOKES
        });

        if (!response.ok) {
            throw new Error(`Dad joke API error: ${response.status}`);
        }

        const data: DadJokeResponse = await response.json();
        return data.joke;
    }

    static async fetchChuckNorrisJoke(): Promise<string> {
        const response = await fetch(API_URLS.CHUCK_NORRIS);

        if (!response.ok) {
            throw new Error(`Chuck Norris API error: ${response.status}`);
        }

        const data: ChuckNorrisResponse = await response.json(); 
        return data.value; // Retorna a piada
    }


    static async fetchWeather(latitude: number, longitude: number): Promise<WeatherApiResponse> {
        const response = await fetch(
            `${API_URLS.WEATHER}?latitude=${latitude}&longitude=${longitude}&current=${WEATHER_API_PARAMS.CURRENT}&timezone=${WEATHER_API_PARAMS.TIMEZONE}`
        );

        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }

        return await response.json();
    }

    static async fetchCityName(latitude: number, longitude: number): Promise<string> {
        try {
            const url = `${API_URLS.GEOCODING}?${new URLSearchParams({
                latitude: latitude.toString(),
                longitude: longitude.toString(),
                localityLanguage: 'en'
              })}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data: GeocodingResponse = await response.json();
            
            return data.city 
                || data.locality
                || data.localityInfo?.administrative?.find(a => a.order === 6)?.name  // Município
                || data.localityInfo?.administrative?.find(a => a.order === 4)?.name  // Estado
                || data.principalSubdivision //Estado ou província
                || 'Unknown location';
                
        } catch (error) {
            console.error('Error fetching city name:', error);
            throw error;
        }
    }

    static getUserLocation(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            console.log('Checking geolocation support...');

            if (!navigator.geolocation) {
                console.log('Geolocation not supported by browser');
                reject(new Error('Geolocation not supported'));
                return;
            }

            console.log('Requesting user location...');
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    console.log('Location obtained:', position.coords);
                    resolve(position);
                },
                (error) => {
                    console.log('Geolocation error:', error);
                    console.log('Error code:', error.code);
                    console.log('Error message:', error.message);
                    reject(error);
                },
                {
                    timeout: GEOLOCATION_CONFIG.TIMEOUT,
                    enableHighAccuracy: GEOLOCATION_CONFIG.ENABLE_HIGH_ACCURACY,
                    maximumAge: GEOLOCATION_CONFIG.MAXIMUM_AGE
                }
            );
        });
    }
}

export { ApiService };
export type { WeatherApiResponse };

