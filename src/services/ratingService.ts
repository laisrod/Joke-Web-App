interface JokeReport {
    joke: string;
    score: number;
    date: string;
}

class RatingService {
    private reports: JokeReport[] = [];
    private currentScore: number | null = null;

    setCurrentScore(score: number): void {
        this.currentScore = score;
    }

    getCurrentScore(): number | null {
        return this.currentScore;
    }

    hasPendingRating(joke: string): boolean {
        return joke !== '' && this.currentScore !== null;
    }

    saveRating(joke: string, score: number): void {
        this.reports.push({
            joke: joke,
            score: score,
            date: new Date().toISOString()
        });
    }

    resetScore(): void {
        this.currentScore = null;
    }
    
    getAllReports(): JokeReport[] {
        return [...this.reports];
    }
}

export { RatingService };
export type { JokeReport };
