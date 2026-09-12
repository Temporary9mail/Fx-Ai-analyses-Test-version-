# Market Signal AI

A small 3-file-style static website concept for uploading a trading chart and showing an UP/DOWN/WAIT result with confidence.

## Important limitation

Twelve Data is a market-data API. It does not itself read a screenshot and determine the market symbol, timeframe, or an UP/DOWN signal. A robust version needs:

1. A vision-capable AI/backend to read the uploaded screenshot (symbol, timeframe, chart context).
2. Twelve Data (or another market-data source) to retrieve current/recent OHLC data.
3. A defined analysis strategy to calculate a signal and confidence.
4. A backend/serverless function so private API keys are not exposed in the browser.

This ZIP includes a transparent browser demo rather than pretending that screenshot analysis is guaranteed accurate.

## Twelve Data key

Edit `config.js`:

`TWELVE_DATA_API_KEY: "YOUR_KEY_HERE"`

For a public GitHub repository, do NOT commit a real secret key. Use environment variables on a backend/serverless function.

## Run

Open `index.html` in a browser, upload a chart screenshot, and press **Analyze Market**.

## Production architecture

Recommended flow:

Browser → secure backend → vision model reads screenshot → extract symbol/timeframe → Twelve Data OHLC request → strategy analysis → return `{market, timeframe, signal, confidence, reason}` → browser.

Do not market the confidence percentage as a guaranteed probability of winning. It should represent the model/strategy's confidence in its analysis.
