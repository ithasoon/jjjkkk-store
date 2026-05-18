import db from './server/db.js';

try {
  const accounts = db.prepare('SELECT * FROM accounts').all();
  console.log('Accounts:', accounts);
  const info = db.prepare('INSERT INTO accounts (type, name, phone, is_deleted) VALUES (?, ?, ?, 0)').run('CUSTOMER', 'test', '123');
  console.log('Insert:', info);
} catch (e) {
  console.error('Error inserting account:', e);
}

try {
  const items = db.prepare('SELECT * FROM inventory').all();
  console.log('Items:', items);
  const info2 = db.prepare('INSERT INTO inventory (item_name, quantity, purchase_price, purchase_currency, total_cost) VALUES (?, ?, ?, ?, ?)').run('test_item', 1, 10, 'USD', 10);
  console.log('Insert item:', info2);
} catch (e) {
  console.error('Error inserting item:', e);
}
