interface DadJokeResponse {
    joke: string;
}

interface ChuckNorrisResponse {
    value: string;
}

interface JokeReport {
    joke: string;
    score: number;
    date: string;
}

interface WeatherData {
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
    city: string;
}

class JokesApp {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private weatherCard: HTMLElement;
    private isLoading = false;
// Array privado para armazenar todas as avaliações
    private reportAcudits: JokeReport[] = []; 
    private currentJoke: string = '';
    private currentScore: number | null = null;

    constructor() {
        console.log('JokesApp constructor started');
        
        this.jokeDisplay = document.getElementById('joke-display') as HTMLElement;
        this.nextJokeBtn = document.getElementById('next-joke-btn') as HTMLElement;
        this.weatherCard = document.getElementById('weather-card') as HTMLElement;
        
        console.log('Elements found:', {
            jokeDisplay: !!this.jokeDisplay,
            nextJokeBtn: !!this.nextJokeBtn,
            weatherCard: !!this.weatherCard
        });
        
        // Lógica de Implementação - Inicialização dos Event Listeners
        document.querySelectorAll('.score-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const score = parseInt(target.getAttribute('data-score') || '0');
                this.currentScore = score;
                
                document.querySelectorAll('.score-btn').forEach(btn => btn.classList.remove('selected'));
                target.classList.add('selected');
            });
        });
        
        // Salvamento da Avaliação
        this.nextJokeBtn.addEventListener('click', () => {
            if (this.currentJoke && this.currentScore !== null) {
                this.reportAcudits.push({
                    joke: this.currentJoke,
                    score: this.currentScore,
                    date: new Date().toISOString()
                });
                console.log('reportAcudits:', this.reportAcudits);
            }
            
            this.loadJoke();
        });
        
        console.log('Starting loadWeather...');
        this.loadWeather();
        console.log('Starting loadJoke...');
        this.loadJoke();
    }

    // metodo principal

    private async loadJoke(): Promise<void> {
        console.log('loadJoke called');
        if (this.isLoading) return;
        
        this.setLoadingState(true);
        
        try {
            const useChuckNorris = Math.random() < 0.5;
            console.log(`API Selection: ${useChuckNorris ? 'Chuck Norris' : 'Dad Jokes'}`);
            
            let joke: string;
            try {
                if (useChuckNorris) {
                    joke = await this.loadChuckNorrisJoke();
                } else {
                    joke = await this.loadDadJoke();
                }
            } catch (firstError) {
                console.warn('First API failed, trying fallback:', firstError);
                
                try {
                    if (useChuckNorris) {
                        joke = await this.loadDadJoke();
                    } else {
                        joke = await this.loadChuckNorrisJoke();
                    }
                } catch (secondError) {
                    console.error('Both APIs failed:', secondError);
                    throw new Error('All joke services are temporarily unavailable');
                }
            }
            
            this.displayJoke(joke);
            
        } catch (error) {
            this.displayError('Error loading joke');
            console.error('Error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

    // Exibição da Piada

    private displayJoke(joke: string): void {
        this.currentJoke = joke;
        this.jokeDisplay.textContent = joke;
        this.jokeDisplay.className = 'joke-text';
        
        this.currentScore = null;
        document.querySelectorAll('.score-btn').forEach(btn => btn.classList.remove('selected'));
    }

    private displayError(message: string): void {
        this.jokeDisplay.textContent = message;
        this.jokeDisplay.className = 'joke-text error';
    }

    // Estados de Carregamento
    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.nextJokeBtn.toggleAttribute('disabled', loading);
        
        if (loading) {
            this.jokeDisplay.textContent = 'Loading joke...';
            this.jokeDisplay.className = 'joke-text loading';
        }
    }

// Carregamento de Dad Jokes
    private async loadDadJoke(): Promise<string> {
        const response = await fetch('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Dad joke API error: ${response.status}`);
        }

        const data: DadJokeResponse = await response.json();
        return data.joke;
    }

    // Carregamento de Chuck Norris Jokes

    private async loadChuckNorrisJoke(): Promise<string> {
        const response = await fetch('https://api.chucknorris.io/jokes/random');

        if (!response.ok) {
            throw new Error(`Chuck Norris API error: ${response.status}`);
        }

        const data: ChuckNorrisResponse = await response.json();
        return data.value;
    }

    // Método Principal: `loadWeather()` - clima

    private async loadWeather(): Promise<void> {
        console.log('loadWeather called');
        try {
            const position = await this.getUserLocation();
            const { latitude, longitude } = position.coords;
            
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
            );
            
            if (!weatherResponse.ok) throw new Error('Weather API error');
            
            const weatherData = await weatherResponse.json();
            
            const city = 'Your location';
            
            this.displayWeather({
                temperature: Math.round(weatherData.current.temperature_2m),
                description: this.getWeatherDescription(weatherData.current.weather_code),
                humidity: weatherData.current.relative_humidity_2m,
                windSpeed: Math.round(weatherData.current.wind_speed_10m),
                city: city
            });
            
        } catch (error) {
            console.log('Weather loading failed:', error);
            const errorMessage = this.getErrorMessage(error);
            this.displayWeatherError(errorMessage);
        }
    }
    
    // Obtenção de Localização
    private getUserLocation(): Promise<GeolocationPosition> {
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
                    timeout: 10000,
                    enableHighAccuracy: false,
                    maximumAge: 300000
                }
            );
        });
    }

    // Conversão de Código de Clima
    private getWeatherDescription(code: number): string {
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
        
        return weatherCodes[code] || 'Unknown weather';
    }

    private getWeatherIcon(description: string): string {
        const desc = description.toLowerCase();
        if (desc.includes('clear')) return '☀️';
        if (desc.includes('cloud') || desc.includes('overcast')) return '☁️';
        if (desc.includes('rain') || desc.includes('drizzle')) return '🌧️';
        if (desc.includes('snow')) return '❄️';
        if (desc.includes('thunderstorm')) return '⛈️';
        if (desc.includes('fog')) return '🌫️';
        return '🌤️';
    }

    // exibição do clima
    private displayWeather(weather: WeatherData): void {
        this.weatherCard.innerHTML = `
            <div class="weather-content">
                <div class="weather-icon">${this.getWeatherIcon(weather.description)}</div>
                <div class="weather-temp">${weather.temperature}°C</div>
            </div>
        `;
    }

    // tratamento de erros de clima
    private getErrorMessage(error: unknown): string {
        if (!(error instanceof Error)) return 'Weather service error';
        
        if (error.name === 'GeolocationPositionError') {
            const geolocationError = error as unknown as GeolocationPositionError;
            switch (geolocationError.code) {
                case 1:
                    return 'Location access denied - please allow location access to see weather';
                case 2:
                    return 'Unable to determine your location - please check your internet connection';
                case 3:
                    return 'Location request timed out - please try again';
                default:
                    return 'Location error - please try again';
            }
        }
        // outros tipos de erros
        const message = error.message;
        if (message.includes('Geolocation not supported')) return 'Geolocation not supported by your browser';
        if (message.includes('Weather API error')) return 'Weather service temporarily unavailable';
        
        return 'Unable to load weather information';
    }

    private displayWeatherError(message: string): void {
        this.weatherCard.innerHTML = `<div class="weather-error">${message}</div>`;
    }
}

export { JokesApp };
