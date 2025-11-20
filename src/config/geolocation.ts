export const GEOLOCATION_CONFIG = {
    TIMEOUT: 10000,              // 10 segundos
    ENABLE_HIGH_ACCURACY: false,
    MAXIMUM_AGE: 300000          // 5 minutos (em milissegundos)
} as const;

export const GEOLOCATION_ERROR_MESSAGES = {
    DENIED: 'Location access denied - please allow location access to see weather',
    UNAVAILABLE: 'Unable to determine your location - please check your internet connection',
    TIMEOUT: 'Location request timed out - please try again',
    DEFAULT: 'Location error - please try again',
    NOT_SUPPORTED: 'Geolocation not supported by your browser',
    WEATHER_API_ERROR: 'Weather service temporarily unavailable',
    UNABLE_TO_LOAD: 'Unable to load weather information'
} as const;

