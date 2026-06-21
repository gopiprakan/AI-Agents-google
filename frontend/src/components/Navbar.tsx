import React, { useEffect, useState } from 'react';
import { Network, Bell, Clock, RefreshCw } from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  isWsConnected: boolean;
  unresolvedAlertsCount: number;
  triggerManualSync: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  isWsConnected, 
  unresolvedAlertsCount,
  triggerManualSync 
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'City Telemetry Dashboard';
      case 'monitoring': return 'AI Live Camera Monitoring';
      case 'analytics': return 'Deep Traffic Analytics';
      case 'ambulance': return 'Emergency Ambulance Tracking';
      case 'signal': return 'Junction Controller Override';
      case 'alerts': return 'Incident Alerts Center';
      case 'reports': return 'Reports Export Hub';
      default: return 'ISCTS Control Panel';
    }
  };

  return (
    <header className="h-20 glass-panel border-b border-cardBorder flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-wide">{getTitle()}</h2>
        <p className="text-xs text-slate-400">Integrated Smart City Traffic Solutions (ISCTS)</p>
      </div>

      {/* Stats, Clocks and Status */}
      <div className="flex items-center gap-6">
        {/* Sync Button */}
        <button
          onClick={triggerManualSync}
          className="p-2 rounded-lg bg-white/5 border border-white/5 text-slate-400 hover:text-cyanGlow hover:bg-cyanGlow/10 transition-all duration-200"
          title="Force Refreshes Telemetries"
        >
          <RefreshCw className="w-4 h-4" />
        </button>

        {/* WebSocket Signal Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
          isWsConnected 
            ? 'bg-emeraldSuccess/5 border-emeraldSuccess/30 text-emeraldSuccess glow-emerald' 
            : 'bg-amberWarning/5 border-amberWarning/30 text-amberWarning glow-amber'
        }`}>
          <Network className={`w-4 h-4 ${isWsConnected ? 'animate-pulse' : ''}`} />
          <span>{isWsConnected ? 'LIVE FEED ACTIVE' : 'LOCAL SIMULATOR'}</span>
        </div>

        {/* Notification Bell */}
        <div className="relative">
          <button className="p-2.5 rounded-lg bg-white/5 border border-white/5 text-slate-300 hover:text-white transition-colors duration-200">
            <Bell className="w-4 h-4" />
          </button>
          {unresolvedAlertsCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 flex items-center justify-center bg-roseEmergency text-white text-[10px] font-bold rounded-full px-1.5 border border-background">
              {unresolvedAlertsCount}
            </span>
          )}
        </div>

        {/* Running System Clock */}
        <div className="flex items-center gap-2 text-slate-300 font-mono text-sm bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-cyanGlow" />
          <span>{time.toLocaleTimeString()}</span>
        </div>
      </div>
    </header>
  );
};
