interface DadJokeResponse {
    joke: string;
}

class JokesApp {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private isLoading = false;

    constructor() {
        this.jokeDisplay = document.getElementById('joke-display') as HTMLElement;
        this.nextJokeBtn = document.getElementById('next-joke-btn') as HTMLElement;
        
        this.nextJokeBtn.addEventListener('click', () => this.loadJoke());
        
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
            this.displayError('Erro ao carregar piada');
            console.error('Error:', error);
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
        this.nextJokeBtn.toggleAttribute('disabled', loading);
        
        if (loading) {
            this.jokeDisplay.textContent = 'Carregando piada...';
            this.jokeDisplay.className = 'joke-text loading';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new JokesApp());
