import React, { useEffect, useState } from 'react';
import Input from '../components/Input';
import { Search, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import ConfirmModal from '../components/ConfirmModal';

export default function Inventory() {
  const [items, setItems] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  
  // New item form
  const [showForm, setShowForm] = useState(false);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState('USD');

  // Edit item state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItemName, setEditItemName] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editPrice, setEditPrice] = useState('');
  const [editCurrency, setEditCurrency] = useState('USD');

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
        if (Array.isArray(data)) setItems(data);
        else console.error('Expected array, got:', data);
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/inventory/search?q=${query}`, {
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
        if (Array.isArray(data)) setItems(data);
        else console.error('Expected array, got:', data);
      })
      .catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ item_name: itemName, quantity, purchase_price: price, purchase_currency: currency })
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error creating item: ' + (errorData.error || 'Unknown error'));
        return;
      }
      setShowForm(false);
      fetchInventory();
      setItemName(''); setQuantity(''); setPrice(''); setCurrency('USD');
    } catch (err: any) {
      alert('Error creating item: ' + err.message);
    }
  };

  const startEdit = (item: any) => {
    setEditingId(item.id);
    setEditItemName(item.item_name);
    setEditQuantity(item.quantity);
    setEditPrice(item.purchase_price);
    setEditCurrency(item.purchase_currency || 'USD');
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: number) => {
    const res = await fetch(`/api/inventory/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ item_name: editItemName, quantity: editQuantity, purchase_price: editPrice, purchase_currency: editCurrency })
    });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    setEditingId(null);
    fetchInventory();
  };

  // Confirm Delete state
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const performDelete = async () => {
    if (deleteId) {
      const res = await fetch(`/api/inventory/${deleteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      fetchInventory();
      setDeleteId(null);
    }
  };

  const deleteItem = (id: number) => {
    setDeleteId(id);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <ConfirmModal 
        isOpen={deleteId !== null} 
        message={t('Are you sure you want to delete this item?')}
        confirmText={t('Delete')} 
        cancelText={t('Cancel')}
        onConfirm={performDelete} 
        onCancel={() => setDeleteId(null)} 
      />
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{t('Inventory')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all">
          <Plus size={18} /> {t('Add Item')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6 flex gap-4">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search size={18} className="absolute start-4 top-3.5 text-slate-400" />
          <Input  
            
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
            placeholder={t("Search items by name...")}
          />
        </form>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('Add New Item')}</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Item Name')}</label>
              <Input  required value={itemName} onChange={e => setItemName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Starting Quantity')}</label>
              <Input  type="number" required value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Purchase Price')}</label>
              <div className="flex gap-2">
                <Input  type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
                <select value={currency} onChange={e => setCurrency(e.target.value)} className="px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium">
                  <option value="USD">USD</option>
                  <option value="IQD">IQD</option>
                </select>
              </div>
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">{t('Save Item')}</button>
          </form>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <div className="min-w-[50rem]">
          <table className="w-full text-start border-collapse">
            <thead className="bg-slate-50 text-[0.625rem] uppercase text-slate-400 font-bold border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">{t('Item Name')}</th>
                <th className="px-6 py-4 text-end">{t('Quantity')}</th>
                <th className="px-6 py-4 text-end">{t('Purchase Price')}</th>
                <th className="px-6 py-4 text-end">{t('Currency')}</th>
                <th className="px-6 py-4 text-end">{t('Total Cost Value')}</th>
                <th className="px-6 py-4 text-end">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-50">
              {items.map(item => (
                editingId === item.id ? (
                  <tr key={item.id} className="bg-indigo-50/50">
                    <td className="px-6 py-4">
                      <Input  value={editItemName} onChange={e => setEditItemName(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm" />
                    </td>
                    <td className="px-6 py-4">
                      <Input  type="number" value={editQuantity} onChange={e => setEditQuantity(e.target.value)} className="w-full text-end px-2 py-1 bg-white border border-slate-200 rounded text-sm font-mono" />
                    </td>
                    <td className="px-6 py-4">
                      <Input  type="number" step="0.01" value={editPrice} onChange={e => setEditPrice(e.target.value)} className="w-full text-end px-2 py-1 bg-white border border-slate-200 rounded text-sm font-mono" />
                    </td>
                    <td className="px-6 py-4">
                      <select value={editCurrency} onChange={e => setEditCurrency(e.target.value)} className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-sm font-medium">
                        <option value="USD">USD</option>
                        <option value="IQD">IQD</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-end font-mono font-semibold text-slate-800">{editCurrency === 'USD' ? '$' : 'IQD '}{Number((Number(editQuantity) || 0) * (Number(editPrice) || 0)).toLocaleString()}</td>
                    <td className="px-6 py-4 text-end flex justify-end gap-2">
                      <button onClick={() => saveEdit(item.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors" title="Save"><Check size={16}/></button>
                      <button onClick={cancelEdit} className="p-1.5 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors" title="Cancel"><X size={16}/></button>
                    </td>
                  </tr>
                ) : (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-800">{item.item_name}</td>
                    <td className="px-6 py-4 text-end font-mono text-slate-600">{Number(item.quantity).toLocaleString()}</td>
                    <td className="px-6 py-4 text-end font-mono text-slate-600">{(item.purchase_currency || 'USD') === 'USD' ? '$' : 'IQD '}{Number(item.purchase_price).toLocaleString()}</td>
                    <td className="px-6 py-4 text-end font-mono text-slate-500">{item.purchase_currency || 'USD'}</td>
                    <td className="px-6 py-4 text-end font-mono font-semibold text-slate-800">{(item.purchase_currency || 'USD') === 'USD' ? '$' : 'IQD '}{Number(item.total_cost).toLocaleString()}</td>
                    <td className="px-6 py-4 text-end flex justify-end gap-3">
                      <button onClick={() => startEdit(item)} className="text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 size={16} /></button>
                      <button onClick={() => deleteItem(item.id)} className="text-slate-400 hover:text-rose-600 transition-colors"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                )
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">{t('No inventory items found. Add some!')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
