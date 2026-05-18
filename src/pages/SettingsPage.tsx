import React, { useState } from 'react';
import Input from '../components/Input';
import { useLanguage } from '../context/LanguageContext';
import { KeyRound, Globe, Save, Mail } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';


export default function SettingsPage() {
  const { lang, setLang, t, dir } = useLanguage();
  const [alertOpen, setAlertOpen] = useState(false);
  const [alertMsg, setAlertMsg] = useState('');

  const showAlert = (message: string) => {
    setAlertMsg(message);
    setAlertOpen(true);
  };

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [msg, setMsg] = useState('');

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/settings/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ oldPassword, newPassword })
      });
      if (res.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if(res.ok) {
        setMsg('Password updated successfully');
        setOldPassword('');
        setNewPassword('');
      } else {
        setMsg(data.error);
      }
    } catch(err) {
      setMsg('Connection error');
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto font-sans" >
      <ConfirmModal 
        isOpen={alertOpen}
        message={alertMsg}
        confirmText={t('OK')}
        cancelText={t('Close')}
        onConfirm={() => {
          setAlertOpen(false);
          if (alertMsg.includes('Reloading') || alertMsg.includes('إعادة تحميل')) {
             window.location.reload();
          }
        }}
        onCancel={() => setAlertOpen(false)}
      />
      <h1 className="text-3xl font-bold mb-8 text-slate-800">{lang === 'ar' ? 'الإعدادات' : 'Settings'}</h1>

      <div className="space-y-6">
        
        {/* Language Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">{lang === 'ar' ? 'اللغة' : 'Language'}</h2>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setLang('en')}
              className={`px-4 py-2 rounded-xl font-medium border transition-colors ${lang === 'en' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              English
            </button>
            <button 
              onClick={() => setLang('ar')}
              className={`px-4 py-2 rounded-xl font-medium border transition-colors ${lang === 'ar' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              العربية
            </button>
          </div>
        </div>

        {/* Password Section */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <KeyRound className="text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-800">{lang === 'ar' ? 'أمان الحساب' : 'Account Security'}</h2>
          </div>
          {msg && <div className="mb-4 text-sm font-semibold text-emerald-600 bg-emerald-50 p-3 rounded-lg">{msg}</div>}
          
          <div className="flex flex-col md:flex-row gap-8">
            <form onSubmit={handlePasswordChange} className="flex-1 max-w-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-700 mb-4">{lang === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'كلمة المرور الحالية' : 'Current Password'}
                </label>
                <Input  type="password" required value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  {lang === 'ar' ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <Input  type="password" required value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" />
              </div>
              <button type="submit" className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 transition-all">
                <Save size={18} /> {lang === 'ar' ? 'حفظ' : 'Save Update'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
