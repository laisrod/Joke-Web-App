interface DadJokeResponse {
    joke: string;
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

    constructor() {
        this.jokeDisplay = document.getElementById('joke-display') as HTMLElement;
        this.nextJokeBtn = document.getElementById('next-joke-btn') as HTMLElement;
        this.weatherCard = document.getElementById('weather-card') as HTMLElement;
        
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
        
        this.loadWeather();
        this.loadJoke();
    }

    private async loadJoke(): Promise<void> {
        if (this.isLoading) return;
        
        this.setLoadingState(true);
        
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: DadJokeResponse = await response.json();
            this.displayJoke(data.joke);
            
        } catch (error) {
            this.displayError('Error loading joke');
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

    private async loadWeather(): Promise<void> {
        try {
            const position = await this.getUserLocation();
            const { latitude, longitude } = position.coords;
            
            const weatherResponse = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&timezone=auto`
            );
            
            if (!weatherResponse.ok) throw new Error('Weather API error');
            
            const weatherData = await weatherResponse.json();
            
            let city = 'Your location';
            try {
                const locationResponse = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
                );
                const locationData = await locationResponse.json();
                city = locationData.address.city || locationData.address.town || locationData.address.village || 'Your location';
            } catch (locationError) {
            }
            
            this.displayWeather({
                temperature: Math.round(weatherData.current.temperature_2m),
                description: this.getWeatherDescription(weatherData.current.weather_code),
                humidity: weatherData.current.relative_humidity_2m,
                windSpeed: Math.round(weatherData.current.wind_speed_10m),
                city: city
            });
            
        } catch (error) {
            console.error('Weather loading failed:', error);
            const errorMessage = this.getErrorMessage(error);
            this.displayWeatherError(errorMessage);
        }
    }

    private getUserLocation(): Promise<GeolocationPosition> {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation not supported'));
                return;
            }
            
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 10000,
                enableHighAccuracy: false
            });
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
                <div class="weather-info">
                    <p class="weather-temp">${weather.temperature}°C</p>
                    <p class="weather-description">${weather.description}</p>
                    <p class="weather-location">📍 ${weather.city}</p>
                    <div class="weather-details">
                        <div class="weather-detail">
                            <span>💧 ${weather.humidity}%</span>
                        </div>
                        <div class="weather-detail">
                            <span>💨 ${weather.windSpeed} km/h</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    private getErrorMessage(error: unknown): string {
        if (!(error instanceof Error)) return 'Weather service error';
        
        const message = error.message;
        if (message.includes('Geolocation not supported')) return 'Geolocation not supported by your browser';
        if (message.includes('Location permission denied')) return 'Location access denied - please allow location access to see weather';
        if (message.includes('Location information unavailable')) return 'Unable to determine your location';
        if (message.includes('Location request timed out')) return 'Location request timed out - please try again';
        if (message.includes('Weather API error')) return 'Weather service temporarily unavailable';
        
        return 'Unable to load weather information';
    }

    private displayWeatherError(message: string): void {
        this.weatherCard.innerHTML = `<div class="weather-error">${message}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => new JokesApp());
