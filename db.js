const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

async function getDbConnection() {
  return open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });
}

async function setupDatabase() {
  const db = await getDbConnection();
  
  await db.exec(`
    CREATE TABLE IF NOT EXISTS urls (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      long_url TEXT UNIQUE NOT NULL,
      short_code TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database and urls table are ready.');
  return db;
}

module.exports = {
  getDbConnection,
  setupDatabase
};
