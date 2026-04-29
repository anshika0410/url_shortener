const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const path = require('path');
const { setupDatabase, getDbConnection } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize DB and store connection
let db;
setupDatabase().then(database => {
  db = database;
}).catch(err => {
  console.error("Failed to setup database", err);
  process.exit(1);
});

// Helper function to generate a random 6-character short code
function generateShortCode() {
  return crypto.randomBytes(4).toString('base64url').substring(0, 6);
}

// Helper to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (err) {
    return false;
  }
}

// POST /shorten -> takes a long URL, returns a short URL
app.post('/shorten', async (req, res) => {
  const { longUrl } = req.body;

  if (!longUrl || !isValidUrl(longUrl)) {
    return res.status(400).json({ error: 'Invalid URL provided.' });
  }

  try {
    // Check for idempotency: does this URL already exist?
    const existing = await db.get('SELECT short_code FROM urls WHERE long_url = ?', [longUrl]);
    
    if (existing) {
      return res.json({ 
        shortUrl: `http://localhost:${PORT}/${existing.short_code}`,
        shortCode: existing.short_code
      });
    }

    // Generate unique short code with basic collision handling
    let shortCode;
    let isUnique = false;
    let attempts = 0;
    
    while (!isUnique && attempts < 5) {
      shortCode = generateShortCode();
      try {
        await db.run('INSERT INTO urls (long_url, short_code) VALUES (?, ?)', [longUrl, shortCode]);
        isUnique = true;
      } catch (err) {
        // If error is UNIQUE constraint violation, we loop again
        if (err.code !== 'SQLITE_CONSTRAINT') {
          throw err;
        }
        attempts++;
      }
    }

    if (!isUnique) {
      return res.status(500).json({ error: 'Failed to generate unique short code after multiple attempts.' });
    }

    res.status(201).json({ 
      shortUrl: `http://localhost:${PORT}/${shortCode}`,
      shortCode: shortCode 
    });

  } catch (error) {
    console.error('Error shortening URL:', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /{shortCode} -> redirects to the original URL
app.get('/:shortCode', async (req, res) => {
  const { shortCode } = req.params;

  try {
    const urlRecord = await db.get('SELECT long_url FROM urls WHERE short_code = ?', [shortCode]);

    if (urlRecord) {
      // Return 302 Found or 301 Moved Permanently for redirect
      res.redirect(302, urlRecord.long_url);
    } else {
      res.status(404).send(`
        <html>
          <body>
            <h1>404 - Not Found</h1>
            <p>The short link you provided does not exist.</p>
            <a href="/">Go back to home</a>
          </body>
        </html>
      `);
    }
  } catch (error) {
    console.error('Error retrieving URL:', error);
    res.status(500).send('Internal server error.');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
