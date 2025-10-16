import { JokesApp } from './app';

const mocks = {
    joke: { textContent: '', className: '', toggleAttribute: jest.fn() },
    btn: { disabled: false, addEventListener: jest.fn(), toggleAttribute: jest.fn() },
    weather: { innerHTML: '' }
};

global.fetch = jest.fn((url: string) => {
    const apis: any = {
        'icanhazdadjoke': { joke: 'Piada teste' },
        'chucknorris': { value: 'Piada Chuck' },
        'open-meteo': { current: { temperature_2m: 25, relative_humidity_2m: 60, wind_speed_10m: 10, weather_code: 1 } },
        'nominatim': { address: { city: 'SP' } }
    };
    const api = Object.keys(apis).find(k => url.includes(k));
    return api 
        ? Promise.resolve({ ok: true, json: () => Promise.resolve(apis[api]) })
        : Promise.reject(new Error('Não achei'));
}) as jest.Mock;

Object.defineProperty(global.navigator, 'geolocation', {
    value: { getCurrentPosition: jest.fn((ok: any) => ok({ coords: { latitude: -23, longitude: -46 } })) },
    writable: true
});

document.getElementById = jest.fn((id: string) => 
    ({ 'joke-display': mocks.joke, 'next-joke-btn': mocks.btn, 'weather-card': mocks.weather }[id])
) as any;
document.querySelectorAll = jest.fn(() => []) as any;

describe('Testes', () => {
    let app: JokesApp;

    beforeEach(() => {
        jest.clearAllMocks();
        mocks.joke.textContent = '';
        mocks.weather.innerHTML = '';
        app = new JokesApp();
    });

    test('Chuck Norris', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.3);
        await app['loadJoke']();
        expect(mocks.joke.textContent).toBe('Piada Chuck');
    });

    test('Dad Jokes', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.7);
        await app['loadJoke']();
        expect(mocks.joke.textContent).toBe('Piada teste');
    });

    test('Fallback funciona', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.3);
        (global.fetch as jest.Mock).mockImplementation((url: string) =>
            url.includes('chucknorris')
                ? Promise.reject(new Error('Erro'))
                : Promise.resolve({ ok: true, json: () => Promise.resolve({ joke: 'Reserva' }) })
        );
        await app['loadJoke']();
        expect(mocks.joke.textContent).toBe('Reserva');
    });

    test('Erro total', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Tudo quebrou'));
        await app['loadJoke']();
        expect(mocks.joke.textContent).toBe('Error loading joke');
    });

    test('Erro geolocalização', async () => {
        (global.navigator.geolocation.getCurrentPosition as jest.Mock)
            .mockImplementation((ok: any, err: any) => err({ code: 1 }));
        await app['loadWeather']();
        expect(mocks.weather.innerHTML).toContain('weather-error');
    });
});
