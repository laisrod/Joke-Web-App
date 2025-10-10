interface JokeResponse {
    joke: string;
}

interface DadJokeResponse {
    id: string;
    joke: string;
    status: number;
}

class JokesApp {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private isLoading: boolean = false;

    constructor() {
        this.jokeDisplay = document.getElementById('joke-display') as HTMLElement;
        this.nextJokeBtn = document.getElementById('next-joke-btn') as HTMLElement;
        
        this.initializeEventListeners();
        this.loadFirstJoke();
    }

    private initializeEventListeners(): void {
        this.nextJokeBtn.addEventListener('click', () => {
            this.loadNextJoke();
        });
    }

    private async loadFirstJoke(): Promise<void> {
        try {
            await this.fetchAndDisplayJoke();
        } catch (error) {
            this.displayError('Erro ao carregar a primeira piada');
            console.error('Error loading first joke:', error);
        }
    }

    private async loadNextJoke(): Promise<void> {
        if (this.isLoading) return;
        
        try {
            await this.fetchAndDisplayJoke();
        } catch (error) {
            this.displayError('Erro ao carregar próxima piada');
            console.error('Error loading next joke:', error);
        }
    }

    private async fetchAndDisplayJoke(): Promise<void> {
        this.setLoadingState(true);
        
        try {
            const response = await fetch('https://icanhazdadjoke.com/', {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: DadJokeResponse = await response.json();
            
            this.displayJoke(data.joke);
            console.log('Nova piada:', data.joke);
            
        } catch (error) {
            throw error;
        } finally {
            this.setLoadingState(false);
        }
    }

    private displayJoke(joke: string): void {
        this.jokeDisplay.textContent = joke;
        this.jokeDisplay.className = 'joke-text';
    }

    private displayError(message: string): void {
        this.jokeDisplay.textContent = message;
        this.jokeDisplay.className = 'joke-text error';
    }

    private setLoadingState(loading: boolean): void {
        this.isLoading = loading;
        
        if (loading) {
            this.jokeDisplay.textContent = 'Carregando piada...';
            this.jokeDisplay.className = 'joke-text loading';
            this.nextJokeBtn.setAttribute('disabled', 'true');
        } else {
            this.nextJokeBtn.removeAttribute('disabled');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new JokesApp();
});
