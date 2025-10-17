import { JokesApp } from './app';

const screenElements = {
    jokeDisplay: { 
        textContent: '',
        className: '',
        toggleAttribute: jest.fn()
    },
    button: { 
        disabled: false,
        addEventListener: jest.fn(),
        toggleAttribute: jest.fn()
    },
    weather: { 
        innerHTML: ''
    }
};

global.fetch = jest.fn((url: string) => {
    const apiResponses: any = {
        'icanhazdadjoke': { joke: 'Test joke' },
        'chucknorris': { value: 'Chuck Norris joke' },
        'open-meteo': { current: { temperature_2m: 25, relative_humidity_2m: 60, wind_speed_10m: 10, weather_code: 1 } },
        'nominatim': { address: { city: 'São Paulo' } }
    };
    
    let whichApi = null;
    if (url.includes('icanhazdadjoke')) whichApi = 'icanhazdadjoke';
    if (url.includes('chucknorris')) whichApi = 'chucknorris';
    if (url.includes('open-meteo')) whichApi = 'open-meteo';
    if (url.includes('nominatim')) whichApi = 'nominatim';
    
    if (whichApi) {
        return Promise.resolve({ 
            ok: true, 
            json: () => Promise.resolve(apiResponses[whichApi]) 
        });
    }
    
    return Promise.reject(new Error('API not found'));
}) as jest.Mock;

Object.defineProperty(global.navigator, 'geolocation', {
    value: { 
        getCurrentPosition: jest.fn((success: any) => {
            success({ coords: { latitude: -23.5, longitude: -46.6 } });
        })
    },
    writable: true
});

document.getElementById = jest.fn((id: string) => {
    if (id === 'joke-display') return screenElements.jokeDisplay;
    if (id === 'next-joke-btn') return screenElements.button;
    if (id === 'weather-card') return screenElements.weather;
    return null;
}) as any;

document.querySelectorAll = jest.fn(() => []) as any;

describe('Jokes App Tests', () => {
    let app: JokesApp;

    beforeEach(() => {
        jest.clearAllMocks();
        screenElements.jokeDisplay.textContent = '';
        screenElements.weather.innerHTML = '';
        app = new JokesApp();
    });

    test('Should load Chuck Norris joke', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.3);
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toBe('Chuck Norris joke');
    });

    test('Should load normal joke', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.7);
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toBe('Test joke');
    });

    test('Should use fallback when Chuck Norris fails', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.3);
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
            if (url.includes('chucknorris')) {
                return Promise.reject(new Error('Chuck Norris unavailable'));
            }
            return Promise.resolve({ 
                ok: true, 
                json: () => Promise.resolve({ joke: 'Fallback joke' }) 
            });
        });
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toBe('Fallback joke');
    });

    test('Should show error when everything fails', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('All failed'));
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toBe('Error loading joke');
    });

    test('Should show error when location denied', async () => {
        (global.navigator.geolocation.getCurrentPosition as jest.Mock)
            .mockImplementation((success: any, error: any) => {
                error({ code: 1 });
            });
        await app['loadWeather']();
        expect(screenElements.weather.innerHTML).toContain('weather-error');
    });
});