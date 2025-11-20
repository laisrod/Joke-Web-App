import { JokeService } from './services/jokeService.js';
import { RatingService } from './services/ratingService.js';
import { UIService } from './ui/uiService.js';
import { WeatherService } from './services/weatherService.js';
import { MESSAGES } from './config/index.js';


class JokesApp {
    private uiService: UIService;
    private ratingService: RatingService;
    
    private isLoading = false;
    private currentJoke: string = '';

    constructor() {
        console.log('JokesApp constructor started');
        
        this.uiService = new UIService();     
        this.ratingService = new RatingService();     
        
        this.setupEventListeners();     
        
        this.loadWeather();
        this.loadJoke();
    }

    private setupEventListeners(): void {

        this.uiService.setupScoreButtons((score) => {
            this.ratingService.setCurrentScore(score);
        });
        
        this.uiService.setupNextJokeButton(() => {

            if (this.ratingService.hasPendingRating(this.currentJoke)) {
                const score = this.ratingService.getCurrentScore();
                if (score !== null) {
                    this.ratingService.saveRating(this.currentJoke, score);
                }
            }
            
            this.ratingService.resetScore();
            this.uiService.resetScoreButtons();
            this.loadJoke();
        });
    }

    private async loadJoke(): Promise<void> {
        console.log('loadJoke called');
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.uiService.setLoadingState(true);
        
        try {
            const joke = await JokeService.fetchJoke();
            this.currentJoke = joke;
            this.uiService.displayJoke(joke);
        } catch (error) {
            this.uiService.displayError(MESSAGES.ERROR_LOADING_JOKE);
            console.error('Error:', error);
        } finally {
            this.isLoading = false;
            this.uiService.setLoadingState(false);
        }
    }

    private async loadWeather(): Promise<void> {
        console.log('loadWeather called');
        try {
            const weatherData = await WeatherService.loadWeather();
            const html = WeatherService.renderWeather(weatherData);
            this.uiService.displayWeather(html);
        } catch (error) {
            console.log('Weather loading failed:', error);
            const errorMessage = WeatherService.getErrorMessage(error);
            const errorHtml = WeatherService.renderWeatherError(errorMessage);
            this.uiService.displayWeather(errorHtml);
        }
    }
}

export { JokesApp };
