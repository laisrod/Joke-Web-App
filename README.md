# Jokes App - Produtividade com Humor

Uma aplicação web em TypeScript que consome uma API de piadas para mostrar piadas aos trabalhadores antes de começarem o dia de trabalho.

## Funcionalidades

-  Exibe uma piada aleatória ao carregar a página
-  Botão "Próxima Piada" para buscar novas piadas
-  Implementado com TypeScript
-  Consome API externa (icanhazdadjoke.com)
-  Interface responsiva e amigável
-  Tratamento de erros
-  Estados de carregamento

## Como executar

1. Instalar dependências:
```bash
npm install
```

2. Compilar o TypeScript:
```bash
npm run build
```

3. Abrir o arquivo `index.html` em um navegador web

## Estrutura do projeto

- `src/app.ts` - Código principal da aplicação em TypeScript
- `index.html` - Interface do usuário
- `dist/app.js` - Código JavaScript compilado
- `tsconfig.json` - Configuração do TypeScript
- `package.json` - Dependências e scripts do projeto

## API utilizada

A aplicação consome a API gratuita [icanhazdadjoke.com](https://icanhazdadjoke.com/) que não requer chave de autenticação.

## Tecnologias utilizadas

- TypeScript
- HTML5
- CSS3
- Fetch API (ES6+)
- Async/Await
