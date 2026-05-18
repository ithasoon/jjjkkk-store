import Database from 'better-sqlite3';
import path from 'path';

// Create a database in the root folder
const db = new Database(path.join(process.cwd(), 'tajer.db'));

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Define Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    shop_name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT,
    email TEXT UNIQUE,
    google_id TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    item_name TEXT UNIQUE NOT NULL,
    quantity REAL NOT NULL DEFAULT 0,
    purchase_price REAL NOT NULL DEFAULT 0,
    total_cost REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT CHECK(type IN ('CUSTOMER', 'MERCHANT')) NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    net_balance_iqd REAL NOT NULL DEFAULT 0,
    net_balance_usd REAL NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    seq_num INTEGER NOT NULL,
    type TEXT CHECK(type IN ('SALE', 'PURCHASE', 'CASH_RECEIPT', 'CASH_DELIVERY')) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    items_json TEXT, -- array of {item_id, item_name, quantity, price, currency: 'IQD'|'USD'}
    
    cash_in_iqd REAL NOT NULL DEFAULT 0,
    cash_out_iqd REAL NOT NULL DEFAULT 0,
    cash_in_usd REAL NOT NULL DEFAULT 0,
    cash_out_usd REAL NOT NULL DEFAULT 0,
    
    total_sales_iqd REAL NOT NULL DEFAULT 0,
    total_sales_usd REAL NOT NULL DEFAULT 0,
    total_purchases_iqd REAL NOT NULL DEFAULT 0,
    total_purchases_usd REAL NOT NULL DEFAULT 0,

    FOREIGN KEY(account_id) REFERENCES accounts(id),
    UNIQUE(account_id, seq_num)
  );
`);

// Try altering existing users table if it exists to add email and google_id
try {
  db.exec('ALTER TABLE users ADD COLUMN email TEXT UNIQUE;');
} catch (e) {
  // column might already exist
}
try {
  db.exec('ALTER TABLE users ADD COLUMN google_id TEXT UNIQUE;');
} catch (e) {
  // column might already exist
}
try {
  // password_hash can be null for oauth users, but it was originally NOT NULL. Let's recreate if needed, but SQLite alter column is hard. We can just leave it and put dummy hashes.
} catch (e) {}

// Try altering existing tables for safe delete
try { db.exec('ALTER TABLE inventory ADD COLUMN is_deleted BOOLEAN DEFAULT 0;'); } catch (e) {}
try { db.exec('ALTER TABLE inventory ADD COLUMN deleted_at DATETIME;'); } catch (e) {}
try { db.exec('ALTER TABLE accounts ADD COLUMN is_deleted BOOLEAN DEFAULT 0;'); } catch (e) {}
try { db.exec('ALTER TABLE accounts ADD COLUMN deleted_at DATETIME;'); } catch (e) {}

// Add currency to inventory
try { db.exec("ALTER TABLE inventory ADD COLUMN purchase_currency TEXT DEFAULT 'USD';"); } catch (e) {}

// Add earnings columns to transactions
try { db.exec('ALTER TABLE transactions ADD COLUMN earnings_iqd REAL NOT NULL DEFAULT 0;'); } catch (e) {}
try { db.exec('ALTER TABLE transactions ADD COLUMN earnings_usd REAL NOT NULL DEFAULT 0;'); } catch (e) {}

// Cleanup old deleted records (older than 7 days)
try {
  db.exec("DELETE FROM inventory WHERE is_deleted = 1 AND deleted_at < datetime('now', '-7 days');");
  db.exec("DELETE FROM accounts WHERE is_deleted = 1 AND deleted_at < datetime('now', '-7 days');");
} catch (e) {}

export default db;
