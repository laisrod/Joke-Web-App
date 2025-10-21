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

// Mock navigator.onLine
Object.defineProperty(global.navigator, 'onLine', {
    writable: true,
    value: true
});

// Mock window.addEventListener for network events
global.addEventListener = jest.fn();
global.window = Object.create(window);
Object.defineProperty(window, 'addEventListener', {
    value: jest.fn()
});

// Mock document.body.appendChild for network status
Object.defineProperty(document, 'body', {
    value: {
        appendChild: jest.fn(),
        removeChild: jest.fn()
    },
    writable: true
});

// Mock document.querySelector and createElement
document.querySelector = jest.fn(() => null);
(document.createElement as any) = jest.fn(() => ({
    className: '',
    textContent: '',
    style: { cssText: '' },
    remove: jest.fn()
}));

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
        jest.useFakeTimers();
        screenElements.jokeDisplay.textContent = '';
        screenElements.weather.innerHTML = '';
        
        // Reset navigator.onLine
        Object.defineProperty(global.navigator, 'onLine', { value: true, writable: true });
        
        app = new JokesApp();
    });

    afterEach(() => {
        jest.useRealTimers();
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

    test('Should show error when location denied', async () => {
        (global.navigator.geolocation.getCurrentPosition as jest.Mock)
            .mockImplementation((success: any, error: any) => {
                error({ code: 1 });
            });
        await app['loadWeather']();
        expect(screenElements.weather.innerHTML).toContain('weather-error');
    });

    test('Should handle network error creation', () => {
        const error = app['createNetworkError']('Test error', true, false, 500);
        
        expect(error.message).toBe('Test error');
        expect(error.isNetworkError).toBe(true);
        expect(error.isTimeout).toBe(false);
        expect(error.statusCode).toBe(500);
    });

    test('Should handle fetch errors correctly', () => {
        const abortError = new Error('The operation was aborted');
        abortError.name = 'AbortError';
        
        const networkError = app['handleFetchError'](abortError);
        expect(networkError.isTimeout).toBe(true);
        expect(networkError.message).toContain('timed out');
    });

    test('Should handle TypeError as network error', () => {
        const typeError = new TypeError('Failed to fetch');
        
        const networkError = app['handleFetchError'](typeError);
        expect(networkError.isNetworkError).toBe(true);
        expect(networkError.message).toContain('Network error');
    });

    test('Should handle unknown errors as network errors', () => {
        const unknownError = new Error('Unknown error');
        
        const networkError = app['handleFetchError'](unknownError);
        expect(networkError.isNetworkError).toBe(true);
    });

    test('Should show network status when going offline', () => {
        // Check if network monitoring was set up
        expect(window.addEventListener).toHaveBeenCalledWith('offline', expect.any(Function));
        expect(window.addEventListener).toHaveBeenCalledWith('online', expect.any(Function));
    });
});