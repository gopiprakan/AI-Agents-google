import React, { useState } from 'react';
import { TrafficCone, Sliders, ToggleLeft, ToggleRight, Radio, Compass, Lock, Unlock } from 'lucide-react';

interface SmartSignalMgmtProps {
  telemetry: any[];
  onUpdateJunction: (configs: any) => void;
  selectedJunction: any;
  setSelectedJunction: (j: any) => void;
  userRole: string;
}

export const SmartSignalMgmt: React.FC<SmartSignalMgmtProps> = ({
  telemetry,
  onUpdateJunction,
  selectedJunction,
  setSelectedJunction,
  userRole
}) => {
  const [activeLaneOverride, setActiveLaneOverride] = useState<string>('');

  const currentJunction = selectedJunction || telemetry[0];

  const handleToggleAdaptive = () => {
    if (!currentJunction) return;
    onUpdateJunction({
      id: currentJunction.id,
      adaptive_mode: !currentJunction.adaptive_mode
    });
  };

  const handleForceGreenLane = (lane: string) => {
    if (!currentJunction) return;
    onUpdateJunction({
      id: currentJunction.id,
      state: 'GREEN',
      current_green_lane: lane,
      cycle_duration: 35 // reset timer for new green
    });
    setActiveLaneOverride(lane);
  };

  const handleStatusChange = (status: string) => {
    if (!currentJunction) return;
    onUpdateJunction({
      id: currentJunction.id,
      status: status
    });
  };

  const lanes = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
  const canModify = ['ADMIN', 'TRAFFIC_OFFICER'].includes(userRole);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. 4-Way Intersection Visualizer */}
      <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col h-[560px]">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">4-Way Junction Visualizer</h3>
            <p className="text-xs text-slate-400">Real-time status of traffic lights and lane timers</p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
              CURRENT GREEN: {currentJunction?.current_green_lane || 'NORTH'}
            </span>
          </div>
        </div>

        {/* Junction Visual Grid */}
        <div className="flex-1 bg-slate-950 rounded-xl relative overflow-hidden border border-cardBorder flex items-center justify-center">
          {/* Roads layout drawing */}
          <div className="absolute inset-0 flex items-center justify-center">
            {/* Horizontal Road */}
            <div className="w-full h-32 bg-slate-900 border-y border-slate-800 flex items-center justify-between px-16 relative">
              <div className="w-full border-t border-dashed border-slate-700 h-0 absolute left-0" />
            </div>
            {/* Vertical Road */}
            <div className="h-full w-32 bg-slate-900 border-x border-slate-800 absolute flex flex-col justify-between py-16">
              <div className="h-full border-l border-dashed border-slate-700 w-0 absolute top-0 left-1/2" />
            </div>
            {/* Core Intersection Box */}
            <div className="w-32 h-32 bg-slate-850 border border-slate-700 z-0 flex items-center justify-center">
              <div className="text-center font-mono text-[10px] text-slate-500 font-bold">
                {currentJunction?.state === 'EMERGENCY_GREEN' ? (
                  <span className="text-roseEmergency animate-pulse">EMERGENCY ACTIVE</span>
                ) : (
                  <span>AUTO CYCLE</span>
                )}
              </div>
            </div>
          </div>

          {/* Render Traffic Lights on 4 Sides */}
          {lanes.map((lane) => {
            const isGreen = currentJunction?.current_green_lane === lane;
            const isEmergency = currentJunction?.state === 'EMERGENCY_GREEN' && isGreen;
            const isYellow = currentJunction?.state === 'YELLOW' && isGreen;
            const isRed = !isGreen;

            // Absolute layouts mapping for lights placement
            const layoutStyle: any = {
              NORTH: { top: '15%', left: '50%', transform: 'translate(-50%, 0)' },
              SOUTH: { bottom: '15%', left: '50%', transform: 'translate(-50%, 0)' },
              EAST: { right: '15%', top: '50%', transform: 'translate(0, -50%)' },
              WEST: { left: '15%', top: '50%', transform: 'translate(0, -50%)' }
            }[lane];

            return (
              <div key={lane} className="absolute flex flex-col items-center gap-1.5 z-10" style={layoutStyle}>
                {/* Traffic Light Shell */}
                <div className="bg-slate-900 border border-slate-700 p-1.5 rounded-full flex flex-col gap-1 shadow-glass">
                  {/* RED */}
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isRed 
                      ? 'bg-roseEmergency shadow-neonRose' 
                      : 'bg-roseEmergency/20'
                  }`} />
                  {/* YELLOW */}
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isYellow 
                      ? 'bg-amberWarning shadow-[0_0_10px_#F59E0B]' 
                      : 'bg-amberWarning/20'
                  }`} />
                  {/* GREEN */}
                  <div className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                    isEmergency 
                      ? 'bg-roseEmergency animate-ping shadow-neonRose' 
                      : isGreen && !isYellow
                        ? 'bg-emeraldSuccess shadow-[0_0_12px_#22C55E]' 
                        : 'bg-emeraldSuccess/20'
                  }`} />
                </div>
                
                {/* Timer details */}
                <span className="text-[9px] font-bold text-white bg-slate-900/90 border border-slate-800 px-2 py-0.5 rounded font-mono">
                  {lane.slice(0, 1)}: {isGreen ? `${currentJunction?.cycle_duration}s` : 'WAIT'}
                </span>
                
                {/* Click Override button */}
                {canModify && !currentJunction?.adaptive_mode && (
                  <button
                    onClick={() => handleForceGreenLane(lane)}
                    className="px-1.5 py-0.5 text-[8px] bg-cyanGlow/10 text-cyanGlow border border-cyanGlow/20 rounded hover:bg-cyanGlow/25 font-bold uppercase"
                  >
                    Force
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Parameters Control Sidebar panel */}
      <div className="space-y-6">
        {/* Active Node Selector */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-4">Select Intersection Node</h4>
          <select
            value={currentJunction?.id}
            onChange={(e) => setSelectedJunction(telemetry.find(t => t.id === e.target.value))}
            className="w-full bg-slate-900 border border-cardBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyanGlow transition-colors"
          >
            {telemetry.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Operating Controllers Toggles */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-6">Decision Mode Controls</h4>
          
          <div className="space-y-4">
            {/* Adaptive vs Manual Mode */}
            <div className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider">AI Adaptive Tuning</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Calculates phase times via lane density</p>
              </div>
              
              <button
                onClick={handleToggleAdaptive}
                disabled={!canModify}
                className={`transition-colors duration-200 rounded-full focus:outline-none ${
                  !canModify ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {currentJunction?.adaptive_mode ? (
                  <ToggleRight className="w-10 h-10 text-cyanGlow" />
                ) : (
                  <ToggleLeft className="w-10 h-10 text-slate-500" />
                )}
              </button>
            </div>

            {/* Manual Lock Warning banner */}
            {!currentJunction?.adaptive_mode && (
              <div className="p-3 bg-amberWarning/10 border border-amberWarning/30 rounded-xl flex gap-3 text-amberWarning">
                <Lock className="w-5 h-5 flex-shrink-0" />
                <div className="text-[11px] leading-relaxed">
                  <span className="font-bold">Manual override lock is active.</span> Cycles are frozen. Signals will only change via direct force keys.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Junction status overrides */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-4">Operations State Overrides</h4>
          
          <div className="space-y-3">
            {['ACTIVE', 'MAINTENANCE', 'OFFLINE'].map((status) => {
              const isActive = currentJunction?.status === status;
              let statusColors = 'bg-white/5 text-slate-400 border-slate-800';
              if (isActive) {
                if (status === 'ACTIVE') statusColors = 'bg-emeraldSuccess/10 text-emeraldSuccess border-emeraldSuccess/30 font-extrabold';
                else if (status === 'MAINTENANCE') statusColors = 'bg-amberWarning/10 text-amberWarning border-amberWarning/30 font-extrabold';
                else statusColors = 'bg-slate-800 text-white border-slate-600 font-extrabold';
              }

              return (
                <button
                  key={status}
                  onClick={() => handleStatusChange(status)}
                  disabled={!canModify}
                  className={`w-full py-2.5 rounded-xl border text-xs font-bold transition-all ${statusColors} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {status}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
