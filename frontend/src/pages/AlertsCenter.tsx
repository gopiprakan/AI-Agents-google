import React, { useState } from 'react';
import { Bell, AlertCircle, AlertTriangle, Info, Check } from 'lucide-react';

interface AlertsCenterProps {
  alerts: any[];
  onResolveAlert: (alertId: string) => void;
  userRole: string;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({ alerts, onResolveAlert, userRole }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(a => {
    const sevMatch = filterSeverity === 'ALL' || a.severity === filterSeverity;
    const statMatch = filterStatus === 'ALL' || a.status === filterStatus;
    return sevMatch && statMatch;
  });

  const canResolve = ['ADMIN', 'TRAFFIC_OFFICER'].includes(userRole);

  return (
    <div className="space-y-6">
      {/* Filters Header bar */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Severity Filter Matrix</h3>
          <p className="text-xs text-slate-400">Sort system alerts by severity logs or status overrides.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filters */}
          <div className="flex bg-white/5 border border-cardBorder p-1.5 rounded-xl gap-1">
            {['ALL', 'UNRESOLVED', 'RESOLVED'].map((stat) => (
              <button
                key={stat}
                onClick={() => setFilterStatus(stat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterStatus === stat 
                    ? 'bg-cyanGlow text-slate-950 font-extrabold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {stat}
              </button>
            ))}
          </div>

          {/* Severity filters */}
          <div className="flex bg-white/5 border border-cardBorder p-1.5 rounded-xl gap-1">
            {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setFilterSeverity(sev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterSeverity === sev 
                    ? 'bg-cyanGlow text-slate-950 font-extrabold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary Alerts Table List */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="space-y-4">
          {filteredAlerts.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No alert logs match the active filter criteria.
            </div>
          ) : (
            filteredAlerts.map((alert) => {
              // Icon mapping based on severity
              let SeverityIcon = Info;
              let iconColors = 'bg-cyanGlow/10 text-cyanGlow border-cyanGlow/20';
              if (alert.severity === 'CRITICAL') {
                SeverityIcon = AlertCircle;
                iconColors = 'bg-roseEmergency/15 text-roseEmergency border-roseEmergency/20 animate-pulse';
              } else if (alert.severity === 'WARNING') {
                SeverityIcon = AlertTriangle;
                iconColors = 'bg-amberWarning/10 text-amberWarning border-amberWarning/20';
              }

              const isUnresolved = alert.status === 'UNRESOLVED';

              return (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                    isUnresolved && alert.severity === 'CRITICAL'
                      ? 'bg-roseEmergency/5 border-roseEmergency/20'
                      : 'bg-white/5 border-cardBorder hover:border-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl border ${iconColors}`}>
                      <SeverityIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">
                          {new Date(alert.created_at).toLocaleString()}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          alert.severity === 'CRITICAL' ? 'bg-roseEmergency/20 text-roseEmergency' : 'bg-amberWarning/20 text-amberWarning'
                        }`}>
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-white mt-1.5">{alert.message}</p>
                      {alert.lane && (
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-semibold">Lane: {alert.lane} Approach</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Resolve action */}
                    {isUnresolved ? (
                      canResolve ? (
                        <button
                          onClick={() => onResolveAlert(alert.id)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emeraldSuccess/10 text-emeraldSuccess border border-emeraldSuccess/35 hover:bg-emeraldSuccess/20 transition-all text-xs font-bold uppercase tracking-wider"
                        >
                          <Check className="w-4 h-4" />
                          <span>Resolve</span>
                        </button>
                      ) : (
                        <span className="text-xs text-roseEmergency font-semibold animate-pulse uppercase">Awaiting Action</span>
                      )
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1.5 bg-slate-900 border border-cardBorder px-3 py-1.5 rounded-xl font-medium">
                        <Check className="w-4 h-4 text-emeraldSuccess" />
                        <span>RESOLVED</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
