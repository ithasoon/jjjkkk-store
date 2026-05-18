import express from 'express';
import db from '../db';
import { authenticate } from './auth';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import multer from 'multer';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.use(authenticate);

// Download database backup (JSON)
router.get('/backup/json', (req, res) => {
  try {
    const inventory = db.prepare('SELECT * FROM inventory').all();
    const accounts = db.prepare('SELECT * FROM accounts').all();
    const transactions = db.prepare('SELECT * FROM transactions').all();
    
    const data = { inventory, accounts, transactions };
    
    res.setHeader('Content-disposition', `attachment; filename=tajer_backup_${new Date().toISOString().slice(0,10)}.json`);
    res.setHeader('Content-type', 'application/json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// Download database backup (ZIP)
router.get('/backup/zip', (req, res) => {
  try {
    const inventory = db.prepare('SELECT * FROM inventory').all();
    const accounts = db.prepare('SELECT * FROM accounts').all();
    const transactions = db.prepare('SELECT * FROM transactions').all();
    
    const data = { inventory, accounts, transactions };
    
    const AdmZip = require('adm-zip');
    const zip = new AdmZip();
    zip.addFile("tajer_backup.json", Buffer.from(JSON.stringify(data, null, 2), 'utf8'));

    res.setHeader('Content-disposition', `attachment; filename=tajer_backup_${new Date().toISOString().slice(0,10)}.zip`);
    res.setHeader('Content-type', 'application/zip');
    res.send(zip.toBuffer());
  } catch (err) {
    console.error('Backup error:', err);
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// Restore database backup (ZIP)
router.post('/restore/zip', upload.single('database'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No backup file uploaded' });
    }

    const uploadedPath = req.file.path;
    
    // Check if it's a ZIP by extension or just attempt to parse
    const AdmZip = require('adm-zip');
    let fileContent = '';
    
    try {
      const zip = new AdmZip(uploadedPath);
      const zipEntries = zip.getEntries();
      if (zipEntries.length > 0) {
        // assume the first file or "tajer_backup.json"
        const jsonEntry = zipEntries.find((entry: any) => entry.entryName.endsWith('.json')) || zipEntries[0];
        fileContent = jsonEntry.getData().toString('utf8');
      } else {
        throw new Error('Empty zip file');
      }
    } catch (e) {
      // Fallback in case they upload plain JSON directly
      fileContent = fs.readFileSync(uploadedPath, 'utf-8');
    }
    
    fs.unlinkSync(uploadedPath);

    const data = JSON.parse(fileContent);

    if (!data.inventory || !data.accounts || !data.transactions) {
      return res.status(400).json({ error: 'Invalid backup file format' });
    }

    const restoreTx = db.transaction(() => {
      // Clear tables
      db.prepare('DELETE FROM transactions').run();
      db.prepare('DELETE FROM inventory').run();
      db.prepare('DELETE FROM accounts').run();

      const insertInventory = db.prepare(`INSERT INTO inventory (id, item_name, quantity, purchase_price, total_cost, is_deleted, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?)`);
      for(const row of data.inventory) {
        insertInventory.run(row.id, row.item_name, row.quantity, row.purchase_price, row.total_cost, row.is_deleted || 0, row.deleted_at || null);
      }

      const insertAccounts = db.prepare(`INSERT INTO accounts (id, type, name, phone, net_balance_iqd, net_balance_usd, created_at, is_deleted, deleted_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for(const row of data.accounts) {
        insertAccounts.run(row.id, row.type, row.name, row.phone, row.net_balance_iqd, row.net_balance_usd, row.created_at, row.is_deleted || 0, row.deleted_at || null);
      }

      const insertTx = db.prepare(`INSERT INTO transactions (id, account_id, seq_num, type, date, items_json, cash_in_iqd, cash_out_iqd, cash_in_usd, cash_out_usd, total_sales_iqd, total_sales_usd, total_purchases_iqd, total_purchases_usd) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      for(const row of data.transactions) {
        insertTx.run(row.id, row.account_id, row.seq_num, row.type, row.date, row.items_json, row.cash_in_iqd, row.cash_out_iqd, row.cash_in_usd, row.cash_out_usd, row.total_sales_iqd, row.total_sales_usd, row.total_purchases_iqd, row.total_purchases_usd);
      }
    });

    restoreTx();
    
    // Send success
    res.json({ success: true, message: 'Database restored from JSON successfully.' });
  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    res.status(500).json({ error: err.message });
  }
});

// Download table as CSV
router.get('/backup/csv', (req, res) => {
  try {
    const type = req.query.type; // 'inventory' or 'accounts'
    let data: any[] = [];
    if(type === 'inventory') {
      data = db.prepare('SELECT id, item_name, quantity, purchase_price, total_cost FROM inventory').all();
    } else {
      data = db.prepare('SELECT id, type, name, phone, net_balance_iqd, net_balance_usd, created_at FROM accounts').all();
    }
    
    if(data.length === 0) {
      return res.status(404).json({error: 'No data to export'});
    }

    const keys = Object.keys(data[0]);
    let csv = keys.join(',') + '\n';
    data.forEach(row => {
      csv += keys.map(k => {
        const val = row[k];
        if(typeof val === 'string') return `"${val.replace(/"/g, '""')}"`;
        return val !== null ? val : '';
      }).join(',') + '\n';
    });
    
    res.setHeader('Content-disposition', `attachment; filename=tajer_${type}_${new Date().toISOString().slice(0,10)}.csv`);
    res.setHeader('Content-type', 'text/csv; charset=utf-8');
    res.write('\ufeff'); // add BOM to fix UTF-8 in Excel
    res.end(csv);
  } catch(err) {
    console.error('CSV backup error:', err);
    res.status(500).json({ error: 'Failed to generate CSV' });
  }
});

// Change Password
router.post('/password', (req: any, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.password_hash) {
      const valid = bcrypt.compareSync(oldPassword, user.password_hash);
      if (!valid) return res.status(400).json({ error: 'Incorrect old password' });
    }

    const newHash = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
