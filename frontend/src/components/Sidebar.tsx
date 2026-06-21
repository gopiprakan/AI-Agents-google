import React from 'react';
import { 
  LayoutDashboard, 
  Tv2, 
  BarChart3, 
  HeartHandshake, 
  TrafficCone, 
  BellRing, 
  FilePieChart, 
  LogOut,
  ShieldCheck
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: any;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, user, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'monitoring', label: 'Live Feed', icon: Tv2 },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'ambulance', label: 'Emergency Priority', icon: HeartHandshake, badge: true },
    { id: 'signal', label: 'Signal Controller', icon: TrafficCone },
    { id: 'alerts', label: 'Alerts Hub', icon: BellRing },
    { id: 'reports', label: 'Reports Export', icon: FilePieChart },
  ];

  return (
    <aside className="w-64 glass-panel border-r border-cardBorder flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Logo Header */}
      <div className="p-6 border-b border-cardBorder flex items-center gap-3">
        <div className="p-2 bg-cyanGlow/10 rounded-lg border border-cyanGlow/30 animate-pulse">
          <svg className="w-6 h-6 text-cyanGlow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-white tracking-wider text-lg">ISCTS</h1>
          <p className="text-[10px] text-cyanGlow/70 tracking-widest uppercase">Traffic Portal</p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                isActive 
                  ? 'bg-cyanGlow/10 text-cyanGlow border border-cyanGlow/20 shadow-neonCyan' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-cyanGlow' : 'text-slate-400 group-hover:text-slate-200'}`} />
              <span className="font-medium text-sm">{item.label}</span>
              {item.badge && (
                <span className="ml-auto w-2 h-2 rounded-full bg-roseEmergency animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User Session profile Footer */}
      <div className="p-4 border-t border-cardBorder bg-cardBg/40">
        <div className="flex items-center gap-3 px-2 py-3 rounded-lg bg-white/5 border border-white/5 mb-4">
          <div className="p-1.5 rounded-full bg-cyanGlow/10 text-cyanGlow border border-cyanGlow/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="truncate">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'Guest Officer'}</p>
            <p className="text-[10px] text-cyanGlow font-medium tracking-wider uppercase">{user?.role || 'OPERATOR'}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-roseEmergency/20 text-roseEmergency bg-roseEmergency/5 hover:bg-roseEmergency/10 transition-colors duration-200 font-semibold text-sm"
        >
          <LogOut className="w-4 h-4" />
          <span>Exit Session</span>
        </button>
      </div>
    </aside>
  );
};
