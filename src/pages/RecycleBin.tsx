import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { RefreshCcw, Trash2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RecycleBin() {
  const { lang, t, dir } = useLanguage();
  const [deletedAccounts, setDeletedAccounts] = useState<any[]>([]);
  const [deletedItems, setDeletedItems] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      const accRes = await fetch('/api/accounts/deleted/all?t=' + Date.now(), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (accRes.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (accRes.ok) {
        const data = await accRes.json();
        if (Array.isArray(data)) setDeletedAccounts(data);
      }
      
      const invRes = await fetch('/api/inventory/deleted?t=' + Date.now(), { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      if (invRes.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (invRes.ok) {
        const data = await invRes.json();
        if (Array.isArray(data)) setDeletedItems(data);
      }
    } catch(err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRestoreAccount = async (id: number) => {
    const res = await fetch(`/api/accounts/restore/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    fetchData();
  };

  const handleRestoreItem = async (id: number) => {
    const res = await fetch(`/api/inventory/restore/${id}`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
    if (res.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return;
    }
    fetchData();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto font-sans" >
      <div className="mb-6">
        <Link to="/" className="text-slate-500 hover:text-slate-900 inline-flex items-center gap-2 mb-4 font-medium transition-colors">
          <ArrowLeft size={16} className="" /> {lang === 'ar' ? 'الرئيسية' : 'Dashboard'}
        </Link>
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{lang === 'ar' ? 'المحذوفات مؤخراً' : 'Recently Deleted'}</h1>
        <p className="text-slate-500 text-sm mt-2">
          {lang === 'ar' 
            ? 'يتم الاحتفاظ بالعناصر المحذوفة لمدة 7 أيام قبل حذفها نهائياً.' 
            : 'Deleted items are kept for 7 days before being permanently removed.'}
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
             {lang === 'ar' ? 'الحسابات' : 'Accounts'}
             <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{deletedAccounts.length}</span>
          </h2>
          {deletedAccounts.length === 0 ? (
            <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-500">{lang === 'ar' ? 'لا يوجد' : 'Empty'}</div>
          ) : (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden divide-y divide-slate-50">
              {deletedAccounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{acc.name}</p>
                    <p className="text-xs text-slate-400">{lang === 'ar' ? 'تاريخ الحذف: ' : 'Deleted at: '} {new Date(acc.deleted_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRestoreAccount(acc.id)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                    <RefreshCcw size={16} /> {lang === 'ar' ? 'استعادة' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 text-slate-800 flex items-center gap-2">
             {lang === 'ar' ? 'المواد (المخزن)' : 'Inventory Items'}
             <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-full">{deletedItems.length}</span>
          </h2>
          {deletedItems.length === 0 ? (
            <div className="bg-white border border-slate-100 p-8 rounded-2xl text-center text-slate-500">{lang === 'ar' ? 'لا يوجد' : 'Empty'}</div>
          ) : (
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl overflow-hidden divide-y divide-slate-50">
              {deletedItems.map(item => (
                <div key={item.id} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="font-bold text-slate-800">{item.item_name}</p>
                    <p className="text-xs text-slate-400">{lang === 'ar' ? 'تاريخ الحذف: ' : 'Deleted at: '} {new Date(item.deleted_at).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => handleRestoreItem(item.id)} className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-100 transition-colors">
                    <RefreshCcw size={16} /> {lang === 'ar' ? 'استعادة' : 'Restore'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
