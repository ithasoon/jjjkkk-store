import React, { useState } from 'react';
import Input from '../components/Input';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';


export default function Signup() {
  const { lang, dir } = useLanguage();
  const [shopName, setShopName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shop_name: shopName, username, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        navigate('/login');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Connection error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4" >
      <div className="bg-white p-10 rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100 w-full max-w-md">
        <div className="flex justify-center mb-6">
           <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-indigo-200">T</div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-center mb-8 text-slate-800">
          {lang === 'ar' ? 'إنشاء حساب تاجر' : 'Create a Tajer Account'}
        </h1>
        
        {error && <div className="mb-6 p-4 bg-rose-50 text-rose-500 rounded-xl text-sm font-medium border border-rose-100">{error}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {lang === 'ar' ? 'اسم المتجر' : 'Shop Name'}
            </label>
            <Input  
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
              value={shopName} 
              
              onChange={e => setShopName(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {lang === 'ar' ? 'اسم المستخدم أو الإيميل' : 'Username or Email'}
            </label>
            <Input  
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
              value={username} 
              
              placeholder={lang === 'ar' ? 'username / email' : ''}
              onChange={e => setUsername(e.target.value)} 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <Input  
              type="password" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm" 
              value={password} 
              
              onChange={e => setPassword(e.target.value)} 
            />
          </div>
          <button type="submit" className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:shadow-xl hover:shadow-indigo-200 transition-all mt-6">
            {lang === 'ar' ? 'إنشاء حساب جديد' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {lang === 'ar' ? 'لديك حساب مسبقاً؟ ' : 'Already have an account? '}
          <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors">
            {lang === 'ar' ? 'قم بتسجيل الدخول' : 'Sign in'}
          </Link>
        </div>
      </div>
    </div>
  );
}
