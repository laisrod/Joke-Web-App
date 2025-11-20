import { DOM_IDS, CSS_CLASSES, MESSAGES } from '../config/index.js';


class UIService {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private weatherCard: HTMLElement;

    constructor() {
        this.jokeDisplay = document.getElementById(DOM_IDS.JOKE_DISPLAY) as HTMLElement;
        this.nextJokeBtn = document.getElementById(DOM_IDS.NEXT_JOKE_BTN) as HTMLElement;
        this.weatherCard = document.getElementById(DOM_IDS.WEATHER_CARD) as HTMLElement;
    }

    setupScoreButtons(onScoreClick: (score: number) => void): void {
        document.querySelectorAll(`.${CSS_CLASSES.SCORE_BTN}`).forEach(button => {
            button.addEventListener('click', (e) => {
                const target = e.target as HTMLElement;
                const score = parseInt(target.getAttribute('data-score') || '0');
                this.selectScoreButton(target);
                onScoreClick(score); // executa: ratingService.setCurrentScore(score)
            });
        });
    }

    setupNextJokeButton(onNextClick: () => void): void {
        this.nextJokeBtn.addEventListener('click', onNextClick);
    }

    selectScoreButton(button: HTMLElement): void {
        this.resetScoreButtons();
        button.classList.add(CSS_CLASSES.SELECTED);
    }

    resetScoreButtons(): void {
        document.querySelectorAll(`.${CSS_CLASSES.SCORE_BTN}`).forEach(btn => {
            btn.classList.remove(CSS_CLASSES.SELECTED);
        });
    }

    setLoadingState(loading: boolean): void {
        this.nextJokeBtn.toggleAttribute('disabled', loading);
        
        if (loading) {
            this.jokeDisplay.textContent = MESSAGES.LOADING_JOKE;
            this.jokeDisplay.className = CSS_CLASSES.JOKE_LOADING;
        }
    }

    displayJoke(joke: string): void {
        this.jokeDisplay.textContent = joke;
        this.jokeDisplay.className = CSS_CLASSES.JOKE_TEXT;
    }

    displayError(message: string): void {
        this.jokeDisplay.textContent = message;
        this.jokeDisplay.className = CSS_CLASSES.JOKE_ERROR;
    }

    displayWeather(html: string): void {
        this.weatherCard.innerHTML = html;
    }
}

export { UIService };
