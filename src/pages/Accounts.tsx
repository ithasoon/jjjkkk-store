import React, { useEffect, useState } from 'react';
import Input from '../components/Input';
import { Link } from 'react-router-dom';
import { Search, Plus, UserPlus } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Accounts() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const { t } = useLanguage();
  
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('CUSTOMER');

  const fetchAccounts = () => {
    fetch('/api/accounts?t=' + Date.now(), {
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
        if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          console.error('Expected array of accounts, got:', data);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetch(`/api/accounts/search?q=${query}`, {
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
        if (Array.isArray(data)) {
          setAccounts(data);
        } else {
          console.error('Expected array, got:', data);
        }
      })
      .catch(console.error);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type, name, phone })
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      if (!res.ok) {
        const errorData = await res.json();
        alert('Error creating account: ' + (errorData.error || 'Unknown error'));
        return;
      }
      setShowForm(false);
      fetchAccounts();
      setName(''); setPhone(''); setType('CUSTOMER');
    } catch (err: any) {
      alert('Error creating account: ' + err.message);
    }
  };

  const getBalanceStatus = (iqd: number, usd: number) => {
    if (iqd === 0 && usd === 0) return <span className="text-slate-400 font-medium text-sm">{t('Settled')}</span>;
    if (iqd > 0 || usd > 0) return <span className="text-emerald-600 font-bold text-sm">{t('They Owe Us')}</span>;
    return <span className="text-rose-500 font-bold text-sm">{t('We Owe Them')}</span>;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{t('Accounts')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 flex items-center gap-2 transition-all">
          <UserPlus size={18} /> {t('New Account')}
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm mb-6">
        <form onSubmit={handleSearch} className="relative">
          <Search size={18} className="absolute start-4 top-3.5 text-slate-400" />
          <Input  
            
            value={query} onChange={e => setQuery(e.target.value)}
            className="w-full ps-11 pe-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
            placeholder={t("Search accounts by name or phone...")}
          />
        </form>
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">{t('Create New Account')}</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Account Type')}</label>
              <select value={type} onChange={e => setType(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm">
                <option value="CUSTOMER">{t('Customer (Zaboon)')}</option>
                <option value="MERCHANT">{t('Merchant (Tajer)')}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Name')}</label>
              <Input  required value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">{t('Phone Number')}</label>
              <Input  value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
            </div>
            <button type="submit" className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">{t('Save Account')}</button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(acc => {
          const initials = acc.name.substring(0, 2).toUpperCase();
          return (
            <Link key={acc.id} to={`/accounts/${acc.id}`} className="block group">
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm group-hover:border-indigo-200 group-hover:shadow-md transition-all cursor-pointer flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 flex flex-col items-center justify-center font-bold text-sm shrink-0">
                      {initials}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-slate-800 leading-tight">{acc.name}</h3>
                      <p className="text-xs text-slate-500 mt-1">{acc.phone || t('No phone provided')}</p>
                    </div>
                  </div>
                  <span className={`text-[0.625rem] px-2 py-1 rounded-md uppercase font-bold ${acc.type === 'CUSTOMER' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                    {acc.type === 'CUSTOMER' ? t('Customer (Zaboon)') : t('Merchant (Tajer)')}
                  </span>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-end">
                  <div>
                    <p className="text-[0.625rem] text-slate-400 uppercase tracking-wider mb-1 font-bold">{t('Net Balance')}</p>
                    <div className="font-mono text-lg font-bold text-slate-800 flex flex-col leading-tight">
                      <span>{Math.abs(acc.net_balance_iqd || 0).toLocaleString()} <span className="text-xs font-sans text-slate-400 font-normal">IQD</span></span>
                      <span>${Math.abs(acc.net_balance_usd || 0).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="text-end flex items-center">
                    {getBalanceStatus(acc.net_balance_iqd || 0, acc.net_balance_usd || 0)}
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      {accounts.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          {t('No accounts found. Create one to start recording transactions.')}
        </div>
      )}
    </div>
  );
}
