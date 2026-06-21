import React from 'react';
import { HeartHandshake, ShieldAlert, CheckCircle2, Navigation, Ban } from 'lucide-react';

interface AmbulanceTrackingProps {
  telemetry: any[];
  priorityLogs: any[];
  onClearOverride: (junctionId: string) => void;
  userRole: string;
}

export const AmbulanceTracking: React.FC<AmbulanceTrackingProps> = ({
  telemetry,
  priorityLogs,
  onClearOverride,
  userRole
}) => {
  // Filter active emergency override junctions
  const activeJunctions = telemetry.filter(t => t.state === 'EMERGENCY_GREEN');

  return (
    <div className="space-y-6">
      {/* 1. Header Grid Description */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-roseEmergency/10 rounded-2xl border border-roseEmergency/20 text-roseEmergency animate-pulse">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Emergency Priority Control (EPC)</h3>
            <p className="text-xs text-slate-400">Real-time GPS coordination and signal priority validation for emergency ambulances.</p>
          </div>
        </div>
      </div>

      {/* 2. Active dispatches grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {activeJunctions.length === 0 ? (
          <div className="glass-panel p-8 rounded-2xl md:col-span-2 text-center flex flex-col items-center justify-center min-h-[220px]">
            <CheckCircle2 className="w-12 h-12 text-emeraldSuccess mb-3 opacity-80" />
            <h4 className="text-base font-bold text-white">No Active Emergency Overrides</h4>
            <p className="text-xs text-slate-400 max-w-sm mt-1">All junctions are running normal cycles. Ambulance sensors are listening.</p>
          </div>
        ) : (
          activeJunctions.map((j) => (
            <div key={j.id} className="glass-panel p-6 rounded-2xl border border-roseEmergency/30 emergency-alert-card flex flex-col justify-between h-[250px]">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-mono bg-roseEmergency/20 text-roseEmergency border border-roseEmergency/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">CODE RED PRIORITY</span>
                    <h4 className="text-base font-bold text-white mt-2">{j.name}</h4>
                  </div>
                  
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-slate-400 font-mono">INCIDENT ID: #AMB-LIVE-CAM</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Priority Direction</p>
                    <p className="text-sm font-bold text-cyanGlow mt-1">{j.current_green_lane} APPROACH</p>
                  </div>
                  
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">ETA to Junction</p>
                    <p className="text-sm font-bold text-roseEmergency mt-1 animate-pulse">0.05m (Approaching)</p>
                  </div>
                </div>
              </div>

              {/* Progress Tracking Bar */}
              <div className="flex items-center gap-3 bg-slate-900/50 p-2.5 rounded-xl border border-white/5">
                <Navigation className="w-4 h-4 text-cyanGlow animate-spin" />
                <div className="flex-1 bg-white/5 h-1 rounded-full relative overflow-hidden">
                  <div className="absolute left-0 top-0 h-full bg-cyanGlow w-4/5 animate-pulse" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">80% CLEAR</span>
              </div>

              {/* Deactivate switch */}
              {['ADMIN', 'TRAFFIC_OFFICER'].includes(userRole) && (
                <button
                  onClick={() => onClearOverride(j.id)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-roseEmergency/20 text-roseEmergency bg-roseEmergency/5 hover:bg-roseEmergency/15 transition-all text-xs font-bold uppercase tracking-wider mt-4"
                >
                  <Ban className="w-4 h-4" />
                  <span>Manual Clear Lock</span>
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* 3. Historic priority logs list */}
      <div className="glass-panel p-6 rounded-2xl">
        <h4 className="text-sm font-bold text-white mb-6">Historical Priority Logs (Last 24 Hours)</h4>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-cardBorder text-slate-400 font-medium">
                <th className="pb-3 text-xs uppercase tracking-wider">Trigger Time</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Ambulance ID</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Target Junction</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Lane Entry</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Duration</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardBorder/40">
              {priorityLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                    No historical logs recorded.
                  </td>
                </tr>
              ) : (
                priorityLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="py-3 text-xs font-mono text-slate-400">
                      {new Date(log.triggered_at).toLocaleString()}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {log.ambulance_id}
                    </td>
                    <td className="py-3">
                      {telemetry.find(t => t.id === log.junction_id)?.name || 'Central Intersection'}
                    </td>
                    <td className="py-3 font-mono text-xs text-slate-300">
                      {log.lane}
                    </td>
                    <td className="py-3 font-mono text-xs">
                      {log.duration_seconds ? `${log.duration_seconds}s` : 'Processing'}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        log.override_status === 'CLEARED' 
                          ? 'bg-emeraldSuccess/10 text-emeraldSuccess border border-emeraldSuccess/25' 
                          : 'bg-roseEmergency/10 text-roseEmergency border border-roseEmergency/25 animate-pulse'
                      }`}>
                        {log.override_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
