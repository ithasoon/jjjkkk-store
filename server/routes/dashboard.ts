import express from 'express';
import db from '../db';
import { authenticate } from './auth';

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  // Total Cash in Drawer: Cash In - Cash Out (across all transactions where it wasn't a bank transfer maybe? 
  // Let's assume all cash_in/out reflect drawer.
  const cashRes = db.prepare(`
    SELECT 
      COALESCE(SUM(cash_in_iqd), 0) - COALESCE(SUM(cash_out_iqd), 0) as total_cash_iqd,
      COALESCE(SUM(cash_in_usd), 0) - COALESCE(SUM(cash_out_usd), 0) as total_cash_usd
    FROM transactions
  `).get() as any;

  // Total Stock Value
  const stockRes = db.prepare(`
    SELECT SUM(quantity * purchase_price) as stock_value
    FROM inventory
    WHERE is_deleted = 0 OR is_deleted IS NULL
  `).get() as any;

  // Total Debt Owed To Us (Sum of net_balances > 0)
  const owedToUs = db.prepare(`
    SELECT 
      SUM(CASE WHEN net_balance_iqd > 0 THEN net_balance_iqd ELSE 0 END) as owed_iqd,
      SUM(CASE WHEN net_balance_usd > 0 THEN net_balance_usd ELSE 0 END) as owed_usd
    FROM accounts
    WHERE coalesce(is_deleted, 0) = 0
  `).get() as any;

  // Total Debt Owed By Us (Sum of net_balances < 0)
  const owedByUs = db.prepare(`
    SELECT 
      SUM(CASE WHEN net_balance_iqd < 0 THEN ABS(net_balance_iqd) ELSE 0 END) as owing_iqd,
      SUM(CASE WHEN net_balance_usd < 0 THEN ABS(net_balance_usd) ELSE 0 END) as owing_usd
    FROM accounts
    WHERE coalesce(is_deleted, 0) = 0
  `).get() as any;

  // Earnings
  const earnings = db.prepare(`
    SELECT 
      SUM(earnings_iqd) as total_earnings_iqd,
      SUM(earnings_usd) as total_earnings_usd
    FROM transactions
  `).get() as any;

  res.json({
    totalCashIqd: cashRes.total_cash_iqd || 0,
    totalCashUsd: cashRes.total_cash_usd || 0,
    stockValue: stockRes.stock_value || 0,
    owedToUsIqd: owedToUs.owed_iqd || 0,
    owedToUsUsd: owedToUs.owed_usd || 0,
    owedByUsIqd: owedByUs.owing_iqd || 0,
    owedByUsUsd: owedByUs.owing_usd || 0,
    earningsIqd: earnings.total_earnings_iqd || 0,
    earningsUsd: earnings.total_earnings_usd || 0,
  });
});

export default router;
