# Snip - URL Shortener

A fast, simple, and elegant URL shortener service built with Node.js, Express, and SQLite.

## Features
- **Idempotency**: Submitting the same long URL multiple times returns the exact same short code.
- **Scalability**: Backed by SQLite, easily capable of handling up to 1 million URLs with appropriate indexing.
- **Beautiful UI**: A clean, premium one-page interface built with vanilla HTML/CSS/JS.

## Requirements
- Node.js (v14 or higher)

## Setup & Run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the server**
   ```bash
   npm start
   ```
   The server will initialize the SQLite database automatically on the first run.

3. **Access the Application**
   Open your browser and navigate to `http://localhost:3000`.

## API Endpoints

### 1. Shorten URL
- **Endpoint**: `/shorten`
- **Method**: `POST`
- **Body**: `{ "longUrl": "https://example.com/very/long/path/here" }`
- **Response**: `{ "shortUrl": "http://localhost:3000/aB3x9Z", "shortCode": "aB3x9Z" }`

### 2. Redirect
- **Endpoint**: `/{shortCode}`
- **Method**: `GET`
- **Behavior**: Redirects the user to the original long URL (HTTP 302). If the code is not found, returns a 404 page.
