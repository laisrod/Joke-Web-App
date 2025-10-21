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

interface NetworkError extends Error {
    isNetworkError: boolean;
    isTimeout: boolean;
    statusCode?: number;
}

interface RetryConfig {
    maxRetries: number;
    baseDelay: number;
    maxDelay: number;
    backoffFactor: number;
}

class JokesApp {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private weatherCard: HTMLElement;
    private isLoading = false;
    private reportAcudits: JokeReport[] = [];
    private currentJoke: string = '';
    private currentScore: number | null = null;
    private jokeApiIndex = 0;
    private isOnline = navigator.onLine;
    private retryConfig: RetryConfig = {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
        backoffFactor: 2
    };

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
        
        // Set up network status monitoring
        this.setupNetworkMonitoring();
        
        document.querySelectorAll('.score-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const score = parseInt(target.getAttribute('data-score') || '0');
                this.currentScore = score;
                
                document.querySelectorAll('.score-btn').forEach(btn => btn.classList.remove('selected'));
                target.classList.add('selected');
            });
        });
        
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

    private setupNetworkMonitoring(): void {
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            this.isOnline = true;
            this.showNetworkStatus('Connection restored', 'success');
            // Retry failed requests when connection is restored
            if (!this.currentJoke) {
                this.loadJoke();
            }
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost');
            this.isOnline = false;
            this.showNetworkStatus('Connection lost. Please check your internet connection or VPN.', 'error');
        });
    }

    private showNetworkStatus(message: string, type: 'success' | 'error'): void {
        // Remove existing status messages
        const existingStatus = document.querySelector('.network-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        const statusDiv = document.createElement('div');
        statusDiv.className = `network-status ${type}`;
        statusDiv.textContent = message;
        statusDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
            background-color: ${type === 'success' ? '#10b981' : '#ef4444'};
        `;

        document.body.appendChild(statusDiv);

        // Auto-remove success messages after 3 seconds
        if (type === 'success') {
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.remove();
                }
            }, 3000);
        }
    }

    private async fetchWithRetry(url: string, options: RequestInit = {}, customRetryConfig?: Partial<RetryConfig>): Promise<Response> {
        const config = { ...this.retryConfig, ...customRetryConfig };
        let lastError: NetworkError;

        for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
            try {
                // Check if we're offline before making the request
                if (!this.isOnline) {
                    throw this.createNetworkError('Network disconnected', true, false);
                }

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });

                clearTimeout(timeoutId);
                return response;

            } catch (error) {
                const networkError = this.handleFetchError(error);
                lastError = networkError;

                console.warn(`Attempt ${attempt + 1}/${config.maxRetries + 1} failed:`, networkError.message);

                // Don't retry if it's not a network error or if we've exhausted retries
                if (!networkError.isNetworkError || attempt === config.maxRetries) {
                    break;
                }

                // Calculate delay with exponential backoff
                const delay = Math.min(
                    config.baseDelay * Math.pow(config.backoffFactor, attempt),
                    config.maxDelay
                );

                console.log(`Retrying in ${delay}ms...`);
                await this.delay(delay);
            }
        }

        throw lastError!;
    }

    private createNetworkError(message: string, isNetworkError: boolean, isTimeout: boolean, statusCode?: number): NetworkError {
        const error = new Error(message) as NetworkError;
        error.isNetworkError = isNetworkError;
        error.isTimeout = isTimeout;
        error.statusCode = statusCode;
        return error;
    }

    private handleFetchError(error: unknown): NetworkError {
        if (error instanceof Error) {
            // Handle AbortError (timeout)
            if (error.name === 'AbortError') {
                return this.createNetworkError('Request timed out - please check your connection', true, true);
            }

            // Handle TypeError (network errors)
            if (error instanceof TypeError && error.message.includes('fetch')) {
                return this.createNetworkError('Network error - please check your internet connection or VPN', true, false);
            }

            // Handle other network-related errors
            if (error.message.includes('NetworkError') || 
                error.message.includes('Failed to fetch') ||
                error.message.includes('Network request failed')) {
                return this.createNetworkError('Connection failed - please check your internet connection or VPN', true, false);
            }
        }

        // Default to treating unknown errors as network errors
        return this.createNetworkError('Network request failed', true, false);
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

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
                    const networkError = secondError as NetworkError;
                    if (networkError.isNetworkError) {
                        throw this.createNetworkError('Connection failed. Please check your internet connection or VPN.', true, networkError.isTimeout);
                    } else {
                        throw this.createNetworkError('All joke services are temporarily unavailable', false, false);
                    }
                }
            }
            
            this.displayJoke(joke);
            
        } catch (error) {
            const networkError = error as NetworkError;
            if (networkError.isNetworkError) {
                if (networkError.isTimeout) {
                    this.displayError('Request timed out. Please check your connection and try again.');
                } else {
                    this.displayError('Connection failed. Please check your internet connection or VPN.');
                }
            } else {
                this.displayError('Error loading joke. Please try again.');
            }
            console.error('Error:', error);
        } finally {
            this.setLoadingState(false);
        }
    }

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

    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        this.nextJokeBtn.toggleAttribute('disabled', loading);
        
        if (loading) {
            this.jokeDisplay.textContent = 'Loading joke...';
            this.jokeDisplay.className = 'joke-text loading';
        }
    }

    private async loadDadJoke(): Promise<string> {
        const response = await this.fetchWithRetry('https://icanhazdadjoke.com/', {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw this.createNetworkError(`Dad joke API error: ${response.status}`, false, false, response.status);
        }

        const data: DadJokeResponse = await response.json();
        return data.joke;
    }

    private async loadChuckNorrisJoke(): Promise<string> {
        const response = await this.fetchWithRetry('https://api.chucknorris.io/jokes/random');

        if (!response.ok) {
            throw this.createNetworkError(`Chuck Norris API error: ${response.status}`, false, false, response.status);
        }

        const data: ChuckNorrisResponse = await response.json();
        return data.value;
    }

    private async loadWeather(): Promise<void> {
        console.log('loadWeather called');
        try {
            const position = await this.getUserLocation();
            const { latitude, longitude } = position.coords;
            
            const weatherResponse = await this.fetchWithRetry(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
            );
            
            if (!weatherResponse.ok) {
                throw this.createNetworkError(`Weather API error: ${weatherResponse.status}`, false, false, weatherResponse.status);
            }
            
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

    private displayWeather(weather: WeatherData): void {
        this.weatherCard.innerHTML = `
            <div class="weather-content">
                <div class="weather-icon">${this.getWeatherIcon(weather.description)}</div>
                <div class="weather-temp">${weather.temperature}°C</div>
            </div>
        `;
    }

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
        
        // Handle network errors
        const networkError = error as NetworkError;
        if (networkError.isNetworkError) {
            if (networkError.isTimeout) {
                return 'Weather request timed out - please check your connection';
            }
            return 'Connection failed - please check your internet connection or VPN';
        }
        
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

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing JokesApp...');
    new JokesApp();
});
