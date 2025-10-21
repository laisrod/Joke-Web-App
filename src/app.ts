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
    private reportAcudits: JokeReport[] = [];
    private currentJoke: string = '';
    private currentScore: number | null = null;
    private jokeApiIndex = 0;
    private isOnline = navigator.onLine;
    private retryCount = 0;
    private maxRetries = 3;
    private retryDelay = 1000; // 1 second

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
        
        // Setup network connectivity listeners
        this.setupNetworkListeners();
        
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

    private async loadJoke(): Promise<void> {
        console.log('loadJoke called');
        if (this.isLoading) return;
        
        // Check network status first
        if (!navigator.onLine) {
            this.displayError('You are offline. Please check your internet connection and try again.');
            return;
        }
        
        this.setLoadingState(true);
        
        try {
            const useChuckNorris = Math.random() < 0.5;
            console.log(`API Selection: ${useChuckNorris ? 'Chuck Norris' : 'Dad Jokes'}`);
            
            let joke: string;
            try {
                if (useChuckNorris) {
                    joke = await this.makeRequestWithRetry(
                        () => this.loadChuckNorrisJoke(),
                        'Chuck Norris API'
                    );
                } else {
                    joke = await this.makeRequestWithRetry(
                        () => this.loadDadJoke(),
                        'Dad Jokes API'
                    );
                }
            } catch (firstError) {
                console.warn('First API failed, trying fallback:', firstError);
                
                try {
                    if (useChuckNorris) {
                        joke = await this.makeRequestWithRetry(
                            () => this.loadDadJoke(),
                            'Dad Jokes API (fallback)'
                        );
                    } else {
                        joke = await this.makeRequestWithRetry(
                            () => this.loadChuckNorrisJoke(),
                            'Chuck Norris API (fallback)'
                        );
                    }
                } catch (secondError) {
                    console.error('Both APIs failed:', secondError);
                    throw secondError;
                }
            }
            
            this.displayJoke(joke);
            this.retryCount = 0; // Reset retry count on success
            
        } catch (error) {
            const errorMessage = this.getNetworkErrorMessage(error);
            this.displayError(errorMessage);
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

    private setupNetworkListeners(): void {
        window.addEventListener('online', () => {
            console.log('Network connection restored');
            this.isOnline = true;
            this.retryCount = 0;
            this.updateNetworkStatus();
            
            // Auto-retry loading content when connection is restored
            if (this.jokeDisplay.textContent?.includes('network') || 
                this.jokeDisplay.textContent?.includes('offline') ||
                this.jokeDisplay.textContent?.includes('connection')) {
                this.loadJoke();
            }
            
            if (this.weatherCard.innerHTML?.includes('network') || 
                this.weatherCard.innerHTML?.includes('offline') ||
                this.weatherCard.innerHTML?.includes('connection')) {
                this.loadWeather();
            }
        });

        window.addEventListener('offline', () => {
            console.log('Network connection lost');
            this.isOnline = false;
            this.updateNetworkStatus();
        });
    }

    private updateNetworkStatus(): void {
        document.body.classList.toggle('offline', !this.isOnline);
        
        if (!this.isOnline) {
            // Show offline indicator in the UI
            const offlineIndicator = document.createElement('div');
            offlineIndicator.className = 'offline-indicator';
            offlineIndicator.textContent = '📡 You are offline';
            offlineIndicator.id = 'offline-indicator';
            
            // Remove existing indicator if present
            const existing = document.getElementById('offline-indicator');
            if (existing) existing.remove();
            
            document.body.appendChild(offlineIndicator);
        } else {
            // Remove offline indicator
            const indicator = document.getElementById('offline-indicator');
            if (indicator) indicator.remove();
        }
    }

    private async makeRequestWithRetry<T>(
        requestFn: () => Promise<T>, 
        context: string = 'request'
    ): Promise<T> {
        for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
            try {
                return await requestFn();
            } catch (error) {
                const isNetworkError = this.isNetworkError(error);
                
                console.log(`${context} attempt ${attempt + 1} failed:`, error);
                
                if (attempt === this.maxRetries || !isNetworkError) {
                    throw error;
                }
                
                // Wait before retrying, with exponential backoff
                const delay = this.retryDelay * Math.pow(2, attempt);
                console.log(`Retrying ${context} in ${delay}ms...`);
                await this.sleep(delay);
            }
        }
        
        throw new Error(`${context} failed after ${this.maxRetries + 1} attempts`);
    }

    private isNetworkError(error: unknown): boolean {
        if (!(error instanceof Error)) return false;
        
        const message = error.message.toLowerCase();
        const networkErrorKeywords = [
            'failed to fetch', 'networkerror', 'connection refused',
            'network request failed', 'load failed', 'dns', 'unreachable',
            'connection timeout', 'network error', 'connection failed'
        ];
        
        // Check for specific network error patterns
        const hasNetworkKeyword = networkErrorKeywords.some(keyword => message.includes(keyword));
        const isTimeoutError = message.includes('timeout') || message.includes('timed out');
        const isFetchError = error.name === 'TypeError' && message.includes('fetch');
        const isAbortError = error.name === 'AbortError';
        
        return hasNetworkKeyword || isTimeoutError || isFetchError || isAbortError || !navigator.onLine;
    }

    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: { 'Accept': 'application/json' },
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Dad joke API error: ${response.status} ${response.statusText}`);
            }

            const data: DadJokeResponse = await response.json();
            return data.joke;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Dad joke API request timed out. Please check your connection.');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async loadChuckNorrisJoke(): Promise<string> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch('https://api.chucknorris.io/jokes/random', {
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Chuck Norris API error: ${response.status} ${response.statusText}`);
            }

            const data: ChuckNorrisResponse = await response.json();
            return data.value;
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                throw new Error('Chuck Norris API request timed out. Please check your connection.');
            }
            throw error;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async loadWeather(): Promise<void> {
        console.log('loadWeather called');
        
        // Check network status first
        if (!navigator.onLine) {
            this.displayWeatherError('Offline - Weather information unavailable');
            return;
        }
        
        try {
            const position = await this.getUserLocation();
            const { latitude, longitude } = position.coords;
            
            const weatherData = await this.makeRequestWithRetry(async () => {
                const weatherResponse = await fetch(
                    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
                );
                
                if (!weatherResponse.ok) {
                    throw new Error(`Weather API error: ${weatherResponse.status} ${weatherResponse.statusText}`);
                }
                
                return await weatherResponse.json();
            }, 'Weather API');
            
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
            const errorMessage = this.getWeatherErrorMessage(error);
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

    private getNetworkErrorMessage(error: unknown): string {
        if (!(error instanceof Error)) return 'Network error occurred. Please try again.';
        
        const message = error.message.toLowerCase();
        
        // Check for specific network error patterns
        if (!navigator.onLine) {
            return 'Connection failed. Please check your internet connection or VPN and try again.';
        }
        
        if (message.includes('timeout') || message.includes('timed out')) {
            return 'Request timed out. Please check your internet connection and try again.';
        }
        
        if (message.includes('failed to fetch') || message.includes('network request failed')) {
            return 'Network disconnected. Please check your internet connection or VPN.';
        }
        
        if (message.includes('connection refused') || message.includes('unreachable')) {
            return 'Unable to connect to the service. Please check your internet connection.';
        }
        
        if (message.includes('dns') || message.includes('resolve')) {
            return 'DNS resolution failed. Please check your internet connection or VPN settings.';
        }
        
        if (this.isNetworkError(error)) {
            return 'Connection failed. If the problem persists, please check your internet connection or VPN.';
        }
        
        return 'Unable to load jokes. Please try again later.';
    }

    private getWeatherErrorMessage(error: unknown): string {
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
        
        const message = error.message.toLowerCase();
        
        if (!navigator.onLine) {
            return 'Offline - Weather information unavailable';
        }
        
        if (this.isNetworkError(error)) {
            return 'Network disconnected - Unable to load weather information';
        }
        
        if (message.includes('geolocation not supported')) return 'Geolocation not supported by your browser';
        if (message.includes('weather api error')) return 'Weather service temporarily unavailable';
        
        return 'Unable to load weather information';
    }

    private getErrorMessage(error: unknown): string {
        return this.getWeatherErrorMessage(error);
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
