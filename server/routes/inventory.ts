import express from 'express';
import db from '../db';
import { authenticate } from './auth';

const router = express.Router();

router.use(authenticate);

// Get all inventory items
router.get('/', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory WHERE is_deleted = 0 OR is_deleted IS NULL').all();
  res.json(items);
});

// Search inventory
router.get('/search', (req, res) => {
  const { q } = req.query;
  const items = db.prepare('SELECT * FROM inventory WHERE item_name LIKE ? AND (is_deleted = 0 OR is_deleted IS NULL)').all(`%${q}%`);
  res.json(items);
});

router.get('/deleted', (req, res) => {
  const items = db.prepare('SELECT * FROM inventory WHERE is_deleted = 1 ORDER BY deleted_at DESC').all();
  res.json(items);
});

// Add new item
router.post('/', (req, res) => {
  const { item_name, quantity, purchase_price, purchase_currency } = req.body;
  
  if (!item_name) return res.status(400).json({ error: 'Item name is required' });

  const qty = Number(quantity) || 0;
  const price = Number(purchase_price) || 0;
  const currency = purchase_currency || 'USD';
  const totalCost = qty * price;

  try {
    const stmt = db.prepare('INSERT INTO inventory (item_name, quantity, purchase_price, purchase_currency, total_cost) VALUES (?, ?, ?, ?, ?)');
    const info = stmt.run(item_name, qty, price, currency, totalCost);
    res.json({ id: info.lastInsertRowid, item_name, quantity: qty, purchase_price: price, purchase_currency: currency, total_cost: totalCost, is_deleted: 0 });
  } catch (error: any) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Item already exists' });
    } else {
      console.error('Inventory error:', error);
      res.status(500).json({ error: 'Database error: ' + error.message });
    }
  }
});

// Update item
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { item_name, quantity, purchase_price, purchase_currency } = req.body;
  
  const item = db.prepare('SELECT * FROM inventory WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(id) as any;
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const name = item_name !== undefined ? item_name : item.item_name;
  const qty = quantity !== undefined ? Number(quantity) : item.quantity;
  const price = purchase_price !== undefined ? Number(purchase_price) : item.purchase_price;
  const currency = purchase_currency !== undefined ? purchase_currency : (item.purchase_currency || 'USD');
  const totalCost = qty * price;

  try {
    db.prepare('UPDATE inventory SET item_name = ?, quantity = ?, purchase_price = ?, purchase_currency = ?, total_cost = ? WHERE id = ?').run(name, qty, price, currency, totalCost, id);
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      res.status(400).json({ error: 'Item name already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Delete item (soft delete)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE inventory SET is_deleted = 1, deleted_at = datetime('now') WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete inventory error:', err);
    res.status(500).json({ error: 'Database error', details: err.message });
  }
});

router.post('/restore/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE inventory SET is_deleted = 0, deleted_at = NULL WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
