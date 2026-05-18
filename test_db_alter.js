import Database from 'better-sqlite3';

const db = new Database('tajer.db');

try { 
  db.exec('ALTER TABLE accounts ADD COLUMN is_deleted BOOLEAN DEFAULT 0;'); 
} catch (e) {
  console.log('Error adding is_deleted to accounts:', e.message);
}

try {
   const info = db.prepare('INSERT INTO accounts (type, name, phone, is_deleted) VALUES (?, ?, ?, 0)').run('CUSTOMER', 'test', null);
   console.log('Inserted!', info);
} catch (e) {
   console.log('Insert error:', e.message);
}
