import express from 'express';
import db from '../db';
import { authenticate } from './auth';

const router = express.Router();
router.use(authenticate);

/** 
 * Transactions Core Logic 
 * If (Sales + Cash Out) > (Purchases + Cash In) => User is a debtor
 * Auto-debt calculation is handled by recalculating the net_balance field on the accounts table
 * every time a transaction is added.
 */

router.post('/', (req, res) => {
  const { account_id, type, items, cash_in_iqd, cash_out_iqd, cash_in_usd, cash_out_usd } = req.body;

  if (!account_id || !type) return res.status(400).json({ error: 'Missing required fields' });
  if (!['SALE', 'PURCHASE', 'CASH_RECEIPT', 'CASH_DELIVERY'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  const itemsJson = items && items.length > 0 ? JSON.stringify(items) : null;
  
  let totalSalesIqd = 0, totalSalesUsd = 0;
  let totalPurchasesIqd = 0, totalPurchasesUsd = 0;

  // Process items
  if (items && items.length > 0) {
    for (const item of items) {
      if (item.item_id) {
        const dbItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item.item_id) as any;
        if (!dbItem) return res.status(400).json({ error: `Item ${item.item_name} not found in inventory` });
      }

      const lineTotal = Number(item.quantity) * Number(item.price);
      
      if (type === 'SALE') {
        if (item.currency === 'IQD') totalSalesIqd += lineTotal;
        else totalSalesUsd += lineTotal;
      } else if (type === 'PURCHASE') {
        if (item.currency === 'IQD') totalPurchasesIqd += lineTotal;
        else totalPurchasesUsd += lineTotal;
      }
    }
  }

  // Use a transaction ensures zero data loss
  const createTx = db.transaction(() => {
    // Determine next sequence number
    const lastTx = db.prepare('SELECT seq_num FROM transactions WHERE account_id = ? ORDER BY seq_num DESC LIMIT 1').get(account_id) as any;
    const seqNum = lastTx ? lastTx.seq_num + 1 : 1;

    const inIqd = Number(cash_in_iqd) || 0;
    const outIqd = Number(cash_out_iqd) || 0;
    const inUsd = Number(cash_in_usd) || 0;
    const outUsd = Number(cash_out_usd) || 0;

    let earningsIqd = 0, earningsUsd = 0;

    // Update global inventory stock
    if (items && items.length > 0) {
      for (const item of items) {
        let itemId = item.item_id;
        
        if (!itemId && type === 'PURCHASE' && item.item_name) {
           const existing = db.prepare('SELECT id FROM inventory WHERE item_name = ?').get(item.item_name) as any;
           if (existing) {
             itemId = existing.id;
             item.item_id = itemId;
           } else {
             const info = db.prepare('INSERT INTO inventory (item_name, quantity, purchase_price) VALUES (?, ?, ?)').run(item.item_name, 0, item.price || 0);
             itemId = info.lastInsertRowid;
             item.item_id = itemId;
           }
        }

        if (itemId) {
          const qty = Number(item.quantity) || 0;
          const currentItem = db.prepare('SELECT purchase_price FROM inventory WHERE id = ?').get(itemId) as any;
          const buyPrice = currentItem ? currentItem.purchase_price : 0;
          
          // Save historical purchase price for reference
          item.purchase_price = buyPrice; 

          if (type === 'SALE') {
            const sellPrice = Number(item.price) || 0;
            const profitPerItem = sellPrice - buyPrice;
            const lineProfit = profitPerItem * qty;
            if (item.currency === 'IQD') earningsIqd += lineProfit;
            else earningsUsd += lineProfit;

            // Decrease stock
            db.prepare('UPDATE inventory SET quantity = quantity - ?, total_cost = (quantity - ?) * purchase_price WHERE id = ?').run(qty, qty, itemId);
          } else if (type === 'PURCHASE') {
            // Increase stock and update latest purchase price
            const newPurchasePrice = Number(item.price) || buyPrice;
            db.prepare('UPDATE inventory SET quantity = quantity + ?, purchase_price = ?, total_cost = (quantity + ?) * ? WHERE id = ?').run(qty, newPurchasePrice, qty, newPurchasePrice, itemId);
          }
        }
      }
    }

    const finalItemsJson = items && items.length > 0 ? JSON.stringify(items) : null;

    // Insert transaction
    const stmt = db.prepare(`
      INSERT INTO transactions 
      (account_id, seq_num, type, items_json, cash_in_iqd, cash_out_iqd, cash_in_usd, cash_out_usd, total_sales_iqd, total_sales_usd, total_purchases_iqd, total_purchases_usd, earnings_iqd, earnings_usd) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(
      account_id, seqNum, type, finalItemsJson, inIqd, outIqd, inUsd, outUsd,
      totalSalesIqd, totalSalesUsd, totalPurchasesIqd, totalPurchasesUsd, earningsIqd, earningsUsd
    );

    // Update account balances
    // Balance formula: (Sales + Cash Out) - (Purchases + Cash In)
    const netIqdChange = (totalSalesIqd + outIqd) - (totalPurchasesIqd + inIqd);
    const netUsdChange = (totalSalesUsd + outUsd) - (totalPurchasesUsd + inUsd);

    db.prepare('UPDATE accounts SET net_balance_iqd = net_balance_iqd + ?, net_balance_usd = net_balance_usd + ? WHERE id = ?')
      .run(netIqdChange, netUsdChange, account_id);

    return info.lastInsertRowid;
  });

  try {
    const txId = createTx();
    res.json({ success: true, transaction_id: txId });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete transaction (revert balances and inventory)
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  
  const txProcess = db.transaction(() => {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(id) as any;
    if (!tx) throw new Error('Transaction not found');
    
    // Revert account balances
    // Original formula: netIqdChange = (totalSalesIqd + outIqd) - (totalPurchasesIqd + inIqd)
    const netIqdChange = (tx.total_sales_iqd + tx.cash_out_iqd) - (tx.total_purchases_iqd + tx.cash_in_iqd);
    const netUsdChange = (tx.total_sales_usd + tx.cash_out_usd) - (tx.total_purchases_usd + tx.cash_in_usd);
    
    // Revert means subtract the change we added
    db.prepare('UPDATE accounts SET net_balance_iqd = net_balance_iqd - ?, net_balance_usd = net_balance_usd - ? WHERE id = ?')
      .run(netIqdChange, netUsdChange, tx.account_id);
    
    // Revert inventory
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
    
    // Delete transaction
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  });
  
  try {
    txProcess();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update transaction
router.put('/:id', (req, res) => {
  const txId = req.params.id;
  const { account_id, type, items, cash_in_iqd, cash_out_iqd, cash_in_usd, cash_out_usd } = req.body;

  if (!account_id || !type) return res.status(400).json({ error: 'Missing required fields' });
  if (!['SALE', 'PURCHASE', 'CASH_RECEIPT', 'CASH_DELIVERY'].includes(type)) {
    return res.status(400).json({ error: 'Invalid transaction type' });
  }

  const txProcess = db.transaction(() => {
    const oldTx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(txId) as any;
    if (!oldTx) throw new Error('Transaction not found');
    
    // === 1. REVERT OLD TRANSACTION ===
    const oldNetIqdChange = (oldTx.total_sales_iqd + oldTx.cash_out_iqd) - (oldTx.total_purchases_iqd + oldTx.cash_in_iqd);
    const oldNetUsdChange = (oldTx.total_sales_usd + oldTx.cash_out_usd) - (oldTx.total_purchases_usd + oldTx.cash_in_usd);
    
    db.prepare('UPDATE accounts SET net_balance_iqd = net_balance_iqd - ?, net_balance_usd = net_balance_usd - ? WHERE id = ?')
      .run(oldNetIqdChange, oldNetUsdChange, oldTx.account_id);
    
    if (oldTx.items_json) {
      const oldItems = JSON.parse(oldTx.items_json);
      for (const item of oldItems) {
        if (item.item_id) {
          const qty = Number(item.quantity) || 0;
          if (oldTx.type === 'SALE') {
            db.prepare('UPDATE inventory SET quantity = quantity + ?, total_cost = (quantity + ?) * purchase_price WHERE id = ?').run(qty, qty, item.item_id);
          } else if (oldTx.type === 'PURCHASE') {
            if (item.purchase_price !== undefined) {
              db.prepare('UPDATE inventory SET quantity = quantity - ?, purchase_price = ?, total_cost = (quantity - ?) * ? WHERE id = ?').run(qty, item.purchase_price, qty, item.purchase_price, item.item_id);
            } else {
              db.prepare('UPDATE inventory SET quantity = quantity - ?, total_cost = (quantity - ?) * purchase_price WHERE id = ?').run(qty, qty, item.item_id);
            }
          }
        }
      }
    }

    // === 2. APPLY NEW TRANSACTION ===
    let totalSalesIqd = 0, totalSalesUsd = 0;
    let totalPurchasesIqd = 0, totalPurchasesUsd = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        if (item.item_id) {
          const dbItem = db.prepare('SELECT * FROM inventory WHERE id = ?').get(item.item_id) as any;
          if (!dbItem) throw new Error(`Item ${item.item_name} not found in inventory`);
        }
        const lineTotal = Number(item.quantity) * Number(item.price);
        if (type === 'SALE') {
          if (item.currency === 'IQD') totalSalesIqd += lineTotal;
          else totalSalesUsd += lineTotal;
        } else if (type === 'PURCHASE') {
          if (item.currency === 'IQD') totalPurchasesIqd += lineTotal;
          else totalPurchasesUsd += lineTotal;
        }
      }
    }

    const inIqd = Number(cash_in_iqd) || 0;
    const outIqd = Number(cash_out_iqd) || 0;
    const inUsd = Number(cash_in_usd) || 0;
    const outUsd = Number(cash_out_usd) || 0;

    let earningsIqd = 0, earningsUsd = 0;

    if (items && items.length > 0) {
      for (const item of items) {
        let itemId = item.item_id;
        
        if (!itemId && type === 'PURCHASE' && item.item_name) {
           const existing = db.prepare('SELECT id FROM inventory WHERE item_name = ?').get(item.item_name) as any;
           if (existing) {
             itemId = existing.id;
             item.item_id = itemId;
           } else {
             const info = db.prepare('INSERT INTO inventory (item_name, quantity, purchase_price) VALUES (?, ?, ?)').run(item.item_name, 0, item.price || 0);
             itemId = info.lastInsertRowid;
             item.item_id = itemId;
           }
        }

        if (itemId) {
          const qty = Number(item.quantity) || 0;
          const currentItem = db.prepare('SELECT purchase_price FROM inventory WHERE id = ?').get(itemId) as any;
          const buyPrice = currentItem ? currentItem.purchase_price : 0;
          
          item.purchase_price = buyPrice; 

          if (type === 'SALE') {
            const sellPrice = Number(item.price) || 0;
            const profitPerItem = sellPrice - buyPrice;
            const lineProfit = profitPerItem * qty;
            if (item.currency === 'IQD') earningsIqd += lineProfit;
            else earningsUsd += lineProfit;

            db.prepare('UPDATE inventory SET quantity = quantity - ?, total_cost = (quantity - ?) * purchase_price WHERE id = ?').run(qty, qty, itemId);
          } else if (type === 'PURCHASE') {
            const newPurchasePrice = Number(item.price) || buyPrice;
            db.prepare('UPDATE inventory SET quantity = quantity + ?, purchase_price = ?, total_cost = (quantity + ?) * ? WHERE id = ?').run(qty, newPurchasePrice, qty, newPurchasePrice, itemId);
          }
        }
      }
    }

    const finalItemsJson = items && items.length > 0 ? JSON.stringify(items) : null;

    db.prepare(`
      UPDATE transactions SET 
      account_id = ?, type = ?, items_json = ?, cash_in_iqd = ?, cash_out_iqd = ?, cash_in_usd = ?, cash_out_usd = ?, 
      total_sales_iqd = ?, total_sales_usd = ?, total_purchases_iqd = ?, total_purchases_usd = ?, earnings_iqd = ?, earnings_usd = ?
      WHERE id = ?
    `).run(
      account_id, type, finalItemsJson, inIqd, outIqd, inUsd, outUsd,
      totalSalesIqd, totalSalesUsd, totalPurchasesIqd, totalPurchasesUsd, earningsIqd, earningsUsd,
      txId
    );

    const netIqdChange = (totalSalesIqd + outIqd) - (totalPurchasesIqd + inIqd);
    const netUsdChange = (totalSalesUsd + outUsd) - (totalPurchasesUsd + inUsd);

    db.prepare('UPDATE accounts SET net_balance_iqd = net_balance_iqd + ?, net_balance_usd = net_balance_usd + ? WHERE id = ?')
      .run(netIqdChange, netUsdChange, account_id);
  });

  try {
    txProcess();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
