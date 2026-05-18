import React, { useEffect, useState } from 'react';
import Input from '../components/Input';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

export default function AccountDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const { t } = useLanguage();
  const [inventory, setInventory] = useState<any[]>([]);

  // Tx form
  const [showTxForm, setShowTxForm] = useState(false);
  const [editingTxId, setEditingTxId] = useState<number | null>(null);
  const [txType, setTxType] = useState('SALE');
  const [cashInIqd, setCashInIqd] = useState(0);
  const [cashOutIqd, setCashOutIqd] = useState(0);
  const [cashInUsd, setCashInUsd] = useState(0);
  const [cashOutUsd, setCashOutUsd] = useState(0);
  
  const [selectedItems, setSelectedItems] = useState<{item_id: number, item_name: string, quantity: number, price: number, currency: string}[]>([]);

  // Account Edit Form
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editType, setEditType] = useState('');

  const fetchDetail = () => {
    fetch(`/api/accounts/${id}?t=` + Date.now(), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return new Promise(() => {});
        }
        return res.json();
      })
      .then(data => {
        if (!data.error) setData(data);
        else console.error('Error fetching details:', data.error);
      })
      .catch(console.error);
  };

  const fetchInventory = () => {
    fetch('/api/inventory?t=' + Date.now(), {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
    })
      .then(res => {
        if (res.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
          return new Promise(() => {});
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setInventory(data);
        else console.error('Expected array, got:', data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchDetail();
    fetchInventory();
  }, [id]);

  const handleAddTx = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      account_id: id,
      type: txType,
      items: selectedItems,
      cash_in_iqd: cashInIqd,
      cash_out_iqd: cashOutIqd,
      cash_in_usd: cashInUsd,
      cash_out_usd: cashOutUsd
    };

    if (editingTxId) {
      const res = await fetch(`/api/transactions/${editingTxId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
    } else {
      const res2 = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });
      if (res2.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
    }

    setShowTxForm(false);
    setEditingTxId(null);
    fetchDetail();
    fetchInventory();
    // reset form
    setCashInIqd(0); setCashOutIqd(0); setCashInUsd(0); setCashOutUsd(0);
    setSelectedItems([]);
  };

  const addItemToTx = (invItem: any) => {
    setSelectedItems([...selectedItems, {
      item_id: invItem.id,
      item_name: invItem.item_name,
      quantity: 1,
      price: invItem.purchase_price || 0,
      currency: 'USD'
    }]);
  };

  const addManualItem = () => {
    setSelectedItems([...selectedItems, {
      item_id: null as any,
      item_name: '',
      quantity: 1,
      price: 0,
      currency: 'USD'
    }]);
  };

  const updateTxItem = (index: number, key: string, value: any) => {
    const newItems = [...selectedItems];
    (newItems[index] as any)[key] = value;
    setSelectedItems(newItems);
  };

  const removeTxItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleEditAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/accounts/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ name: editName, phone: editPhone, type: editType })
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    setShowEditForm(false);
    fetchDetail();
  };

  const [deleteAccountId, setDeleteAccountId] = useState<string | null>(null);
  const [deleteTxId, setDeleteTxId] = useState<number | null>(null);

  const performDeleteAccount = async () => {
    if (deleteAccountId) {
      const res = await fetch(`/api/accounts/${deleteAccountId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      navigate('/accounts');
    }
  };

  const handleDeleteAccount = () => {
    setDeleteAccountId(id || null);
  };

  const performDeleteTx = async () => {
    if (deleteTxId) {
      const res = await fetch(`/api/transactions/${deleteTxId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      fetchDetail();
      fetchInventory();
      setDeleteTxId(null);
    }
  };

  const handleDeleteTx = (txId: number) => {
    setDeleteTxId(txId);
  };

  const openEditForm = () => {
    setEditName(account.name);
    setEditPhone(account.phone || '');
    setEditType(account.type);
    setShowEditForm(true);
  };

  const openEditTx = (tx: any) => {
    setEditingTxId(tx.id);
    setTxType(tx.type);
    if (tx.items_json) {
      setSelectedItems(JSON.parse(tx.items_json));
    } else {
      setSelectedItems([]);
    }
    setCashInIqd(tx.cash_in_iqd || 0);
    setCashOutIqd(tx.cash_out_iqd || 0);
    setCashInUsd(tx.cash_in_usd || 0);
    setCashOutUsd(tx.cash_out_usd || 0);
    setShowTxForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!data) return <div className="p-8">Loading...</div>;

  const { account, transactions } = data;

  const getStatusText = (iqd: number, usd: number) => {
    if (iqd === 0 && usd === 0) return 'Account is Settled (0 Balance).';
    let text = [];
    if (iqd > 0) text.push(`${iqd.toLocaleString()} IQD (Owed to Us)`);
    if (iqd < 0) text.push(`${Math.abs(iqd).toLocaleString()} IQD (We Owe Them)`);
    if (usd > 0) text.push(`${usd.toLocaleString()} USD (Owed to Us)`);
    if (usd < 0) text.push(`${Math.abs(usd).toLocaleString()} USD (We Owe Them)`);
    return text.join(' and ');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans">
      <ConfirmModal 
        isOpen={deleteAccountId !== null}
        message={t('Are you sure you want to delete this account and ALL its transactions? This cannot be undone.')}
        confirmText={t('Delete Account')}
        cancelText={t('Cancel')}
        onConfirm={performDeleteAccount}
        onCancel={() => setDeleteAccountId(null)}
      />
      <ConfirmModal 
        isOpen={deleteTxId !== null}
        message={t('Are you sure you want to delete this transaction? This will revert account balances and items inventory.')}
        confirmText={t('Delete Transaction')}
        cancelText={t('Cancel')}
        onConfirm={performDeleteTx}
        onCancel={() => setDeleteTxId(null)}
      />
      <div className="mb-6">
        <Link to="/accounts" className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-2 mb-4 font-medium transition-colors">
          <ArrowLeft size={16} className="" /> {t('Back to Accounts')}
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{account.name}</h1>
              <span className={`px-2 py-1 text-[0.625rem] font-bold rounded-md uppercase ${account.type === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>{account.type}</span>
            </div>
            <p className="text-slate-500 text-sm">{account.phone || t('No phone provided')}</p>
          </div>
          <div className="text-end p-4 bg-slate-50 rounded-xl border border-slate-100">
            <p className="text-[0.625rem] uppercase font-bold text-slate-400 mb-1 tracking-wider">{t('Current Debt Status')}</p>
            <p className="font-bold text-slate-800">{getStatusText(account.net_balance_iqd || 0, account.net_balance_usd || 0)}</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={openEditForm} className="text-sm font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1 transition-colors">
            <Edit size={14} /> {t('Edit Profile')}
          </button>
          <button onClick={handleDeleteAccount} className="text-sm font-medium text-slate-500 hover:text-rose-600 flex items-center gap-1 transition-colors">
            <Trash2 size={14} /> {t('Delete Account')}
          </button>
        </div>
      </div>

      {showEditForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('Edit Account Settings')}</h2>
          <form onSubmit={handleEditAccount} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Account Type')}</label>
              <select value={editType} onChange={e => setEditType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm">
                <option value="CUSTOMER">{t('Customer (Zaboon)')}</option>
                <option value="MERCHANT">{t('Merchant (Tajer)')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Name')}</label>
              <Input   required value={editName} onChange={e => setEditName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Phone Number')}</label>
              <Input  value={editPhone} onChange={e => setEditPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex-1">{t('Save')}</button>
              <button type="button" onClick={() => setShowEditForm(false)} className="bg-slate-100 text-slate-600 px-5 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all">{t('Cancel')}</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-8">
        <button onClick={() => { setEditingTxId(null); setShowTxForm(!showTxForm); }} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 w-full justify-center transition-all">
          <Plus size={18} /> {t('Record New Transaction')}
        </button>
      </div>

      {showTxForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg mb-8">
          <h2 className="text-xl font-bold mb-4 text-slate-800">{editingTxId ? t('Edit Transaction') : t('New Transaction')}</h2>
          <form onSubmit={handleAddTx} className="space-y-6">
            
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Transaction Type')}</label>
              <div className="flex gap-4">
                {['SALE', 'PURCHASE', 'CASH_RECEIPT', 'CASH_DELIVERY'].map(t => (
                  <label key={t} className="flex items-center gap-2 cursor-pointer">
                    <Input  type="radio" name="txType" value={t} checked={txType === t} onChange={() => setTxType(t)} className="accent-indigo-600" />
                    <span className="text-sm font-medium text-slate-700">{t.replace('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Items Section (Only for Sales/Purchases) */}
            {(txType === 'SALE' || txType === 'PURCHASE') && (
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50">
                <h3 className="font-semibold mb-3 text-slate-800">{t('Items')}</h3>
                <div className="mb-4 flex gap-2">
                  <select 
                    className="flex-1 px-4 py-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    onChange={(e) => {
                      if(e.target.value === 'custom') {
                         addManualItem();
                      } else if(e.target.value) {
                         const item = inventory.find(i => i.id === Number(e.target.value));
                         if(item) addItemToTx(item);
                      }
                      e.target.value = '';
                    }}
                  >
                    <option value="">{t('Select an item')}</option>
                    <option value="custom" className="font-bold text-indigo-600">+ {t('Add Custom Item')}</option>
                    {txType !== 'PURCHASE' && inventory.map(inv => <option key={inv.id} value={inv.id}>{inv.item_name} (Stock: {inv.quantity})</option>)}
                  </select>
                </div>
                
                {selectedItems.length > 0 && (
                  <div className="space-y-2">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex flex-wrap md:flex-nowrap items-center gap-2 bg-white p-3 border border-slate-200 rounded-lg shadow-sm">
                        <Input  type="text" placeholder={t('Item Name')} className="flex-1 min-w-[9.375rem] px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" value={item.item_name} onChange={e => updateTxItem(idx, 'item_name', e.target.value)} />
                        <Input  type="number" placeholder="Qty" className="w-20 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm" value={item.quantity} onChange={e => updateTxItem(idx, 'quantity', Number(e.target.value))} />
                        <Input  type="number" step="0.01" placeholder="Price" className="w-28 px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm" value={item.price} onChange={e => updateTxItem(idx, 'price', Number(e.target.value))} />
                        <select className="px-3 py-2 border border-slate-200 bg-slate-50 rounded-lg text-sm font-medium" value={item.currency} onChange={e => updateTxItem(idx, 'currency', e.target.value)}>
                          <option value="USD">USD</option>
                          <option value="IQD">IQD</option>
                        </select>
                        <button type="button" onClick={() => removeTxItem(idx)} className="text-rose-500 px-3 font-bold hover:text-rose-700 transition-colors">✕</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Cash Payments Section */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl">
                <h3 className="font-semibold text-slate-800">{t('Cash Received (In)')}</h3>
                <div>
                  <label className="block text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-1">IQD</label>
                  <Input  type="number" value={cashInIqd} onChange={e => setCashInIqd(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-1">USD</label>
                  <Input  type="number" value={cashInUsd} onChange={e => setCashInUsd(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
              </div>

              <div className="space-y-4 bg-slate-50 p-5 border border-slate-200 rounded-xl">
                <h3 className="font-semibold text-slate-800">{t('Cash Given (Out)')}</h3>
                <div>
                  <label className="block text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-1">IQD</label>
                  <Input  type="number" value={cashOutIqd} onChange={e => setCashOutIqd(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-[0.625rem] font-bold text-slate-400 uppercase tracking-wider mb-1">USD</label>
                  <Input  type="number" value={cashOutUsd} onChange={e => setCashOutUsd(Number(e.target.value))} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 gap-3">
              <button type="button" onClick={() => { setShowTxForm(false); setEditingTxId(null); }} className="px-5 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors">{t('Cancel')}</button>
              <button type="submit" className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">{t('Save Transaction')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <h2 className="text-xl font-bold mb-4 text-slate-800">{t('Transaction History')}</h2>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden">
        {transactions.length === 0 ? (
           <div className="p-8 text-center text-slate-500">No transactions recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="min-w-[50rem]">
              <table className="w-full text-start border-collapse">
                <thead className="bg-slate-50 text-[0.625rem] uppercase text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">T.NO</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Type</th>
                    <th className="px-6 py-4 text-end">Total (IQD)</th>
                    <th className="px-6 py-4 text-end">Total (USD)</th>
                    <th className="px-6 py-4">Items</th>
                    <th className="px-6 py-4 text-end">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
              {transactions.map((tx: any) => {
                const isPos = tx.type === 'SALE' || tx.type === 'CASH_RECEIPT';
                
                // Calculate representation visually
                const showIqd = (tx.total_sales_iqd || tx.total_purchases_iqd || tx.cash_in_iqd || tx.cash_out_iqd) > 0;
                const showUsd = (tx.total_sales_usd || tx.total_purchases_usd || tx.cash_in_usd || tx.cash_out_usd) > 0;
                
                const valIqd = Math.max(tx.total_sales_iqd || 0, tx.total_purchases_iqd || 0, tx.cash_in_iqd || 0, tx.cash_out_iqd || 0);
                const valUsd = Math.max(tx.total_sales_usd || 0, tx.total_purchases_usd || 0, tx.cash_in_usd || 0, tx.cash_out_usd || 0);

                const itemsList = tx.items_json ? JSON.parse(tx.items_json) : [];

                return (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-slate-400">#{tx.seq_num}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{new Date(tx.date).toLocaleDateString()} {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-[0.625rem] font-bold rounded-md uppercase ${
                        tx.type === 'SALE' ? 'bg-indigo-50 text-indigo-600' :
                        tx.type === 'PURCHASE' ? 'bg-orange-50 text-orange-600' :
                        tx.type === 'CASH_RECEIPT' ? 'bg-emerald-50 text-emerald-600' :
                        'bg-rose-50 text-rose-600'
                      }`}>
                        {tx.type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-end font-mono font-bold">
                      {showIqd ? <span className={isPos ? "text-slate-800" : "text-rose-500"}>{valIqd.toLocaleString()}</span> : "-"}
                    </td>
                    <td className="px-6 py-4 text-end font-mono font-bold">
                      {showUsd ? <span className={isPos ? "text-slate-800" : "text-rose-500"}>${valUsd.toLocaleString()}</span> : "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      {itemsList.length > 0 ? (
                        <ul className="list-disc ps-4 space-y-1">
                          {itemsList.map((itm: any, i: number) => (
                             <li key={i}>{itm.quantity}x <span className="font-medium text-slate-700">{itm.item_name}</span></li>
                          ))}
                        </ul>
                      ) : (
                        <span className="italic text-slate-400">Cash Transaction</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-end flex justify-end gap-3">
                      <button onClick={() => openEditTx(tx)} className="text-slate-400 hover:text-indigo-600 transition-colors" title="Edit Transaction">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteTx(tx.id)} className="text-slate-400 hover:text-rose-600 transition-colors" title="Delete Transaction">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
