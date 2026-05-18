import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, Package, LogOut, Settings, Trash2, Menu, X } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useState } from 'react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, dir, lang } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const getNavClass = (path: string) => {
    const isActive = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
    return isActive 
      ? "flex items-center gap-3 px-4 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-medium"
      : "flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors";
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="h-screen flex bg-slate-50 text-slate-900 font-sans overflow-hidden" >
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={closeSidebar}
        ></div>
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 start-0 w-64 bg-white border-e border-slate-200 flex flex-col z-50 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : (dir === 'rtl' ? 'translate-x-full' : '-translate-x-full')
      }`}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">T</div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800">{t('Tajer')}</h1>
          </div>
          <button onClick={closeSidebar} className="lg:hidden text-slate-400 hover:text-slate-600">
            <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          <Link to="/" className={getNavClass('/')} onClick={closeSidebar}>
            <LayoutDashboard size={20} /> {t('Dashboard')}
          </Link>
          <Link to="/accounts" className={getNavClass('/accounts')} onClick={closeSidebar}>
            <Users size={20} /> {t('Accounts')}
          </Link>
          <Link to="/inventory" className={getNavClass('/inventory')} onClick={closeSidebar}>
            <Package size={20} /> {t('Inventory')}
          </Link>
          <Link to="/settings" className={getNavClass('/settings')} onClick={closeSidebar}>
            <Settings size={20} /> {t('Settings')}
          </Link>
          <div className="pt-4 mt-4 border-t border-slate-100"></div>
          <Link to="/recycle-bin" className={getNavClass('/recycle-bin')} onClick={closeSidebar}>
            <Trash2 size={20} /> {lang === 'ar' ? 'المحذوفات' : 'Recycle Bin'}
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-start text-rose-500 hover:bg-rose-50 rounded-xl transition-colors font-medium"
          >
            <LogOut size={20} /> {t('Logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="min-h-[5rem] bg-white border-b border-slate-200 px-6 lg:px-8 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ms-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu size={24} />
            </button>
            <div className="font-semibold text-slate-800">{t('Tajer Management System')}</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center text-slate-600 font-bold text-sm">
              U
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
