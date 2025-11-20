import { JokesApp } from '../app.js';

const elementosDaTela = {
    piada: { 
        textContent: '',
        className: '' 
    },
    
    botao: { 
        disabled: false,
        addEventListener: jest.fn(),
        toggleAttribute: jest.fn() 
    },
    

    clima: { 
        innerHTML: ''
    }
};

Object.defineProperty(global.navigator, 'geolocation', {
    value: { 
        getCurrentPosition: jest.fn((sucesso: any) => {
            sucesso({ 
                coords: { 
                    latitude: -23.5,
                    longitude: -46.6
                } 
            });
        })
    },
    writable: true
});

document.getElementById = jest.fn((id: string) => {
    if (id === 'joke-display') return elementosDaTela.piada;
    if (id === 'next-joke-btn') return elementosDaTela.botao;
    if (id === 'weather-card') return elementosDaTela.clima;
    return null;
}) as any;

document.querySelectorAll = jest.fn(() => []) as any;

global.fetch = jest.fn((url: string) => {
    const respostasDasAPIs: any = {
        'icanhazdadjoke': { joke: 'Por que o programador não dorme? Porque ele debuga!' },
        'chucknorris': { value: 'Chuck Norris não precisa de testes, os testes precisam dele!' },
        'open-meteo': { 
            current: { 
                temperature_2m: 25, 
                weather_code: 1 
            } 
        },
        'bigdatacloud': { city: 'São Paulo' }
    };
    
    let qualAPI = null;
    if (url.includes('icanhazdadjoke')) qualAPI = 'icanhazdadjoke';
    if (url.includes('chucknorris')) qualAPI = 'chucknorris';
    if (url.includes('open-meteo')) qualAPI = 'open-meteo';
    if (url.includes('bigdatacloud')) qualAPI = 'bigdatacloud';
    
    if (qualAPI) {
        return Promise.resolve({ 
            ok: true, 
            json: () => Promise.resolve(respostasDasAPIs[qualAPI]) 
        });
    }
    
    return Promise.reject(new Error('API não encontrada'));
}) as jest.Mock;

describe('🧪 Testes da Aplicação de Piadas', () => {
    let app: JokesApp;

    beforeEach(() => {
        jest.clearAllMocks();
        elementosDaTela.piada.textContent = '';
        elementosDaTela.clima.innerHTML = '';
        app = new JokesApp();
    });


    test('✅ TESTE 1: A aplicação deve iniciar sem erros', () => {
        expect(app).toBeDefined();
        expect(app).toBeInstanceOf(JokesApp);
    });

    test('✅ TESTE 2: Deve exibir uma piada na tela', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.7);
        
        // Carrega uma piada (chama o método privado loadJoke) - JokeService.fetchJoke()
        await app['loadJoke']();
        
        expect(elementosDaTela.piada.textContent).toBe('Por que o programador não dorme? Porque ele debuga!');
    });

    test('✅ TESTE 3: Deve salvar a avaliação de uma piada', () => {
        app['currentJoke'] = 'Por que o programador não dorme? Porque ele debuga!';
        
        app['ratingService'].setCurrentScore(3);
        
        const scoreSalvo = app['ratingService'].getCurrentScore();
        expect(scoreSalvo).toBe(3);
        
        app['ratingService'].saveRating(app['currentJoke'], 3);
        
        const todasAvaliacoes = app['ratingService'].getAllReports();
        expect(todasAvaliacoes.length).toBe(1);
        expect(todasAvaliacoes[0].joke).toBe('Por que o programador não dorme? Porque ele debuga!');
        expect(todasAvaliacoes[0].score).toBe(3);
        
    });

    test('✅ TESTE 4: Deve carregar uma nova piada quando solicitado', async () => {
        jest.spyOn(Math, 'random').mockReturnValue(0.3);
        
        await app['loadJoke']();
        const primeiraPiada = elementosDaTela.piada.textContent;
        
        elementosDaTela.piada.textContent = '';
        await app['loadJoke']();
        const segundaPiada = elementosDaTela.piada.textContent;
        
        expect(segundaPiada).toBeTruthy();
        expect(segundaPiada).not.toBe(''); // Não pode estar vazio
        
    });

    test('✅ TESTE 5: Deve mostrar mensagem de erro quando as APIs falham', async () => {
        (global.fetch as jest.Mock).mockRejectedValue(new Error('Internet caiu'));
        
        await app['loadJoke']();
        
        expect(elementosDaTela.piada.textContent).toBe('Error loading joke');
        
    });
});
