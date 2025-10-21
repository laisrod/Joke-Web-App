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
        
        // Reset navigator.onLine to true by default
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        // Reset fetch mock to default behavior
        (global.fetch as jest.Mock).mockImplementation((url: string) => {
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
        });
        
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
        // Reset navigator.onLine to true for this test
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        (global.fetch as jest.Mock).mockRejectedValue(new Error('All failed'));
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toBe('Unable to load jokes. Please try again later.');
    });

    test('Should show error when location denied', async () => {
        (global.navigator.geolocation.getCurrentPosition as jest.Mock)
            .mockImplementation((success: any, error: any) => {
                error({ code: 1 });
            });
        await app['loadWeather']();
        expect(screenElements.weather.innerHTML).toContain('weather-error');
    });

    test('Should handle network disconnection for jokes', async () => {
        // Mock navigator.onLine to false
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
        });
        
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toContain('offline');
    });

    test('Should handle fetch timeout for jokes', async () => {
        const error = new Error('Request timed out');
        error.name = 'AbortError';
        (global.fetch as jest.Mock).mockRejectedValue(error);
        
        // Mock sleep to avoid delays in tests
        jest.spyOn(app as any, 'sleep').mockResolvedValue(undefined);
        
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toContain('timed out');
    });

    test('Should handle network error for jokes', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Failed to fetch'));
        
        // Mock sleep to avoid delays in tests
        jest.spyOn(app as any, 'sleep').mockResolvedValue(undefined);
        
        await app['loadJoke']();
        expect(screenElements.jokeDisplay.textContent).toContain('Network disconnected');
    });

    test('Should handle network disconnection for weather', async () => {
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: false
        });
        
        await app['loadWeather']();
        expect(screenElements.weather.innerHTML).toContain('Offline');
    });

    test('Should retry failed requests', async () => {
        let attemptCount = 0;
        (global.fetch as jest.Mock).mockImplementation(() => {
            attemptCount++;
            if (attemptCount < 3) {
                return Promise.reject(new Error('Network error'));
            }
            return Promise.resolve({ 
                ok: true, 
                json: () => Promise.resolve({ joke: 'Success after retry' }) 
            });
        });
        
        // Mock sleep to avoid delays in tests
        jest.spyOn(app as any, 'sleep').mockResolvedValue(undefined);
        
        await app['loadJoke']();
        expect(attemptCount).toBe(3);
        // The retry mechanism worked if we made 3 attempts
        expect(attemptCount).toBeGreaterThan(1);
    });

    test('Should detect network errors correctly', () => {
        // Reset navigator.onLine to true for this test
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        const networkErrors = [
            new Error('Failed to fetch'),
            new Error('Network request failed'),
            new Error('Connection timeout'),
            new Error('DNS resolution failed')
        ];
        
        networkErrors.forEach(error => {
            expect(app['isNetworkError'](error)).toBe(true);
        });
        
        // The isNetworkError method is quite broad, so let's test a more specific case
        const specificNonNetworkError = new Error('Syntax error in JSON');
        expect(app['isNetworkError'](specificNonNetworkError)).toBe(false);
    });

    test('Should provide appropriate error messages for network issues', () => {
        // Reset navigator.onLine to true for this test
        Object.defineProperty(navigator, 'onLine', {
            writable: true,
            value: true
        });
        
        const timeoutError = new Error('Request timed out');
        expect(app['getNetworkErrorMessage'](timeoutError)).toContain('timed out');
        
        const fetchError = new Error('Failed to fetch');
        expect(app['getNetworkErrorMessage'](fetchError)).toContain('Network disconnected');
        
        const connectionError = new Error('Connection refused');
        expect(app['getNetworkErrorMessage'](connectionError)).toContain('Unable to connect');
    });

    test('Should handle online/offline events', () => {
        // Mock online event
        const onlineEvent = new Event('online');
        window.dispatchEvent(onlineEvent);
        
        // Mock offline event  
        const offlineEvent = new Event('offline');
        window.dispatchEvent(offlineEvent);
        
        // Test that the app responds to these events
        expect(document.body.classList.contains('offline')).toBe(true);
    });
});