import { ApiService } from './apiservice.js';
import { PROBABILITY, MESSAGES } from '../config/index.js';

class JokeService {
    static async fetchJoke(): Promise<string> {
        const useChuckNorris = Math.random() < PROBABILITY.CHUCK_NORRIS_CHANCE;
        console.log(`API Selection: ${useChuckNorris ? 'Chuck Norris' : 'Dad Jokes'}`);
        
        try {   
            if (useChuckNorris) {
                return await ApiService.fetchChuckNorrisJoke(); 
            } else {
                return await ApiService.fetchDadJoke(); 
            }
        } catch (firstError) { 
            console.warn('First API failed, trying fallback:', firstError);
            
            try {
                if (useChuckNorris) {
                    return await ApiService.fetchDadJoke();
                } else {
                    return await ApiService.fetchChuckNorrisJoke();
                }
            } catch (secondError) {
                console.error('Both APIs failed:', secondError);
                throw new Error(MESSAGES.ALL_JOKES_UNAVAILABLE);
            }
        }
    }
}

export { JokeService };
