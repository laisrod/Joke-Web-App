interface DadJokeResponse {
    joke: string;
}

interface JokeReport {
    joke: string;
    score: number;
    date: string;
}

class JokesApp {
    private jokeDisplay: HTMLElement;
    private nextJokeBtn: HTMLElement;
    private isLoading = false;
    private reportAcudits: JokeReport[] = [];
    private currentJoke: string = '';
    private currentScore: number | null = null;

    constructor() {
        this.jokeDisplay = document.getElementById('joke-display') as HTMLElement;
        this.nextJokeBtn = document.getElementById('next-joke-btn') as HTMLElement;
        
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
        this.currentJoke = joke;
        this.jokeDisplay.textContent = joke;
        this.jokeDisplay.className = 'joke-text';
        
        // Reseta a seleção de pontuação
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
            this.jokeDisplay.textContent = 'Carregando piada...';
            this.jokeDisplay.className = 'joke-text loading';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => new JokesApp());
