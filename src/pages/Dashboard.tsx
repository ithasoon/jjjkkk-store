import { useEffect, useState } from 'react';
import { DollarSign, Package, Banknote, Landmark, TrendingUp } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const { t } = useLanguage();

  useEffect(() => {
    fetch('/api/dashboard?t=' + Date.now(), {
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
        if (!data.error) setStats(data);
        else console.error('Error fetching dashboard stats:', data.error);
      })
      .catch(console.error);
  }, []);

  if (!stats) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold mb-2 text-slate-800">{t('Dashboard Overview')}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title={t("Total Earnings (Profit)")} iqd={stats.earningsIqd} usd={stats.earningsUsd} icon={<TrendingUp className="text-emerald-500" />} colorClass="text-emerald-600" />
        <StatCard title={t("Total Cash in Drawer")} iqd={stats.totalCashIqd} usd={stats.totalCashUsd} icon={<Banknote />} colorClass="text-slate-800" />
        <StatCard title={t("Total Stock Value")} usd={stats.stockValue} icon={<Package />} hideIqd={true} colorClass="text-indigo-600" />
        <StatCard title={t("Total Debt Owed To Us")} iqd={stats.owedToUsIqd} usd={stats.owedToUsUsd} icon={<DollarSign className="text-emerald-600"/>} colorClass="text-rose-500" />
        <StatCard title={t("Total Debt Owed By Us")} iqd={stats.owedByUsIqd} usd={stats.owedByUsUsd} icon={<Landmark className="text-rose-600"/>} colorClass="text-orange-500" />
      </div>
    </div>
  );
}

function StatCard({ title, iqd, usd, icon, hideIqd = false, colorClass = "text-slate-800" }: { title: string, iqd?: number, usd?: number, icon: any, hideIqd?: boolean, colorClass?: string }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</h3>
        <div className="p-2 bg-slate-50 text-slate-500 rounded-xl">{icon}</div>
      </div>
      <div>
        {!hideIqd && iqd !== undefined && (
          <div className="text-2xl font-bold font-mono text-slate-800">
            {Number(iqd || 0).toLocaleString()} <span className="text-xs text-slate-400 font-sans">IQD</span>
          </div>
        )}
        <div className={`text-xl font-bold font-mono ${colorClass} mt-1`}>
          ${Number(usd || 0).toLocaleString()} <span className="text-xs text-slate-400 font-sans">USD</span>
        </div>
      </div>
    </div>
  );
}
