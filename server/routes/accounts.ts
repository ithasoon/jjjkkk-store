import express from 'express';
import db from '../db';
import { authenticate } from './auth';

const router = express.Router();
router.use(authenticate);

// Get all accounts
router.get('/', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts WHERE is_deleted = 0 OR is_deleted IS NULL ORDER BY name ASC').all();
  res.json(accounts);
});

// Search accounts
router.get('/search', (req, res) => {
  const { q } = req.query;
  const accounts = db.prepare('SELECT * FROM accounts WHERE (name LIKE ? OR phone LIKE ?) AND (is_deleted = 0 OR is_deleted IS NULL) ORDER BY name ASC').all(`%${q}%`, `%${q}%`);
  res.json(accounts);
});

router.get('/deleted/all', (req, res) => {
  const accounts = db.prepare('SELECT * FROM accounts WHERE is_deleted = 1 ORDER BY deleted_at DESC').all();
  res.json(accounts);
});

// Create new account
router.post('/', (req, res) => {
  const { type, name, phone } = req.body;
  if (!name || !type) return res.status(400).json({ error: 'Name and type are required' });
  if (type !== 'CUSTOMER' && type !== 'MERCHANT') return res.status(400).json({ error: 'Invalid type' });

  try {
    const info = db.prepare('INSERT INTO accounts (type, name, phone, is_deleted) VALUES (?, ?, ?, 0)').run(type, name, phone || null);
    res.json({ id: info.lastInsertRowid, type, name, phone, net_balance_iqd: 0, net_balance_usd: 0, is_deleted: 0 });
  } catch (error: any) {
    console.error('Account insert error:', error);
    res.status(500).json({ error: 'Database error: ' + error.message });
  }
});

// Get a single account
router.get('/:id', (req, res) => {
  const account = db.prepare('SELECT * FROM accounts WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').get(req.params.id);
  if (!account) return res.status(404).json({ error: 'Account not found' });
  
  const transactions = db.prepare('SELECT * FROM transactions WHERE account_id = ? ORDER BY seq_num DESC').all(req.params.id);
  res.json({ account, transactions });
});

// Update account
router.put('/:id', (req, res) => {
  const { type, name, phone } = req.body;
  const { id } = req.params;
  
  try {
    db.prepare('UPDATE accounts SET type = ?, name = ?, phone = ? WHERE id = ? AND (is_deleted = 0 OR is_deleted IS NULL)').run(type, name, phone || null, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Delete account
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const txProcess = db.transaction(() => {
    // Revert inventory for all transactions of this account
    const txs = db.prepare('SELECT id, type, items_json FROM transactions WHERE account_id = ?').all(id) as any[];
    
    for (const tx of txs) {
      if (tx.items_json) {
        const items = JSON.parse(tx.items_json);
        for (const item of items) {
          if (item.item_id) {
            const qty = Number(item.quantity) || 0;
            if (tx.type === 'SALE') {
              // Revert decreased stock
              db.prepare('UPDATE inventory SET quantity = quantity + ?, total_cost = (quantity + ?) * purchase_price WHERE id = ?').run(qty, qty, item.item_id);
            } else if (tx.type === 'PURCHASE') {
              // Revert increased stock and purchase price
              if (item.purchase_price !== undefined) {
                db.prepare('UPDATE inventory SET quantity = quantity - ?, purchase_price = ?, total_cost = (quantity - ?) * ? WHERE id = ?').run(qty, item.purchase_price, qty, item.purchase_price, item.item_id);
              } else {
                db.prepare('UPDATE inventory SET quantity = quantity - ?, total_cost = (quantity - ?) * purchase_price WHERE id = ?').run(qty, qty, item.item_id);
              }
            }
          }
        }
      }
    }
    
    // Delete all transactions fully
    db.prepare('DELETE FROM transactions WHERE account_id = ?').run(id);
    
    // Delete the account fully, instead of soft delete since transactions are fully reverted
    db.prepare("DELETE FROM accounts WHERE id = ?").run(id);
  });

  try {
    txProcess();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Database error' });
  }
});

router.post('/restore/:id', (req, res) => {
  const { id } = req.params;
  try {
    db.prepare("UPDATE accounts SET is_deleted = 0, deleted_at = NULL WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
