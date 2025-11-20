# Jokes App - Ready to Laugh?

A modern TypeScript web application that displays jokes from multiple APIs to brighten your day with humor.

## Features

- **Multi-API Joke System**: Alternates between Dad Jokes and Chuck Norris jokes
- **Joke Rating System**: Users can rate jokes from 1-3 stars
- **Weather Integration**: Shows current weather based on user location
- **City Name Detection**: Automatically detects and displays your city name using reverse geocoding
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: Robust fallback mechanisms for API failures
- **Unit Tests**: Comprehensive Jest test suite

## How to Run

1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript:
```bash
npm run build
```

3. Open `index.html` in a web browser

## Development

- **Watch mode**: `npm run dev` (auto-compiles on changes)
- **Run tests**: `npm test`
- **Test coverage**: `npm run test:coverage`

## Project Structure

- `src/app.ts` - Main application logic in TypeScript
- `src/app.test.ts` - Unit tests
- `index.html` - User interface
- `css/styles.css` - Styling
- `dist/app.js` - Compiled JavaScript
- `jest.config.js` - Test configuration
- `tsconfig.json` - TypeScript configuration

## APIs Used

- **Dad Jokes**: [icanhazdadjoke.com](https://icanhazdadjoke.com/)
- **Chuck Norris**: [api.chucknorris.io](https://api.chucknorris.io/)
- **Weather**: [api.open-meteo.com](https://api.open-meteo.com/)
- **Geocoding (City Name)**: [api.bigdatacloud.net](https://www.bigdatacloud.com/) - Reverse geocoding to get city name from coordinates

## Technologies

- TypeScript
- HTML5 & CSS3
- Fetch API
- Geolocation API (for getting user coordinates)
- Reverse Geocoding API (for getting city name from coordinates)
- Jest (testing)
- ES6 Modules