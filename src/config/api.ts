export const API_URLS = {
    DAD_JOKES: 'https://icanhazdadjoke.com/',
    CHUCK_NORRIS: 'https://api.chucknorris.io/jokes/random',
    WEATHER: 'https://api.open-meteo.com/v1/forecast',
    GEOCODING: 'https://api.bigdatacloud.net/data/reverse-geocode-client'
} as const;

export const API_HEADERS = {
    DAD_JOKES: { 'Accept': 'application/json' }
} as const;

