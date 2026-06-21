import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Compass,
  ArrowUpRight,
  Car,
  ActivityIcon
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

interface DashboardProps {
  telemetry: any[];
  alerts: any[];
  summary: any;
  chartData: any[];
  setSelectedJunction: (j: any) => void;
  setActiveTab: (t: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  telemetry,
  alerts,
  summary,
  chartData,
  setSelectedJunction,
  setActiveTab
}) => {
  
  // Calculate average congestion score
  const avgCongestion = telemetry.length 
    ? Math.round(telemetry.reduce((acc, curr) => acc + (curr.congestion_score || 0), 0) / telemetry.length)
    : 38;

  const handleJunctionClick = (j: any) => {
    setSelectedJunction(j);
    setActiveTab('signal');
  };

  return (
    <div className="space-y-6">
      {/* 1. Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Metric 1: Total Flow */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Car className="w-32 h-32 text-cyanGlow" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vehicles Processed</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {summary.total_vehicles_processed?.toLocaleString() || '1,280'}
              </h3>
            </div>
            <div className="p-3 bg-cyanGlow/10 rounded-xl border border-cyanGlow/20 text-cyanGlow">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-emeraldSuccess flex items-center gap-1 mt-4">
            <ArrowUpRight className="w-4 h-4" />
            <span>+12.4% vs last hour</span>
          </p>
        </div>

        {/* Metric 2: Average Congestion */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Activity className="w-32 h-32 text-amberWarning" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Congestion Score</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {avgCongestion}%
              </h3>
            </div>
            <div className="p-3 bg-amberWarning/10 rounded-xl border border-amberWarning/20 text-amberWarning">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          {/* Congestion Gauge Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-1.5 rounded-full bg-amberWarning transition-all duration-500" 
                style={{ width: `${avgCongestion}%` }}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Overall average status: Moderate</p>
          </div>
        </div>

        {/* Metric 3: Active Signals */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <Compass className="w-32 h-32 text-emeraldSuccess" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Junctions</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {telemetry.length || '4'}
              </h3>
            </div>
            <div className="p-3 bg-emeraldSuccess/10 rounded-xl border border-emeraldSuccess/20 text-emeraldSuccess">
              <Compass className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-4">
            <span className="w-2 h-2 rounded-full bg-emeraldSuccess animate-pulse" />
            <span>Telemetry streams running</span>
          </p>
        </div>

        {/* Metric 4: Alert Backlog */}
        <div className="glass-panel glass-panel-hover p-6 rounded-2xl relative overflow-hidden group">
          <div className="absolute right-0 bottom-0 translate-x-3 translate-y-3 opacity-5 group-hover:scale-110 transition-transform duration-300">
            <AlertTriangle className="w-32 h-32 text-roseEmergency" />
          </div>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Alert Log</p>
              <h3 className="text-3xl font-extrabold text-white mt-2 tracking-tight">
                {alerts.filter(a => a.status === 'UNRESOLVED').length}
              </h3>
            </div>
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              alerts.filter(a => a.status === 'UNRESOLVED').length > 0 
                ? 'bg-roseEmergency/10 border-roseEmergency/30 text-roseEmergency animate-pulse'
                : 'bg-white/5 border-cardBorder text-slate-400'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-4">
            <span>Critical actions unresolved</span>
          </p>
        </div>
      </div>

      {/* 2. Interactive Map and Real-time Traffic Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG City Heatmap Grid */}
        <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col h-[420px]">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="text-sm font-bold text-white tracking-wide">Live Smart City Grid Heatmap</h4>
              <p className="text-xs text-slate-400">Click coordinates to focus override controls</p>
            </div>
            <span className="text-[10px] text-cyanGlow border border-cyanGlow/20 px-2 py-0.5 rounded-full font-mono font-semibold bg-cyanGlow/5">
              GRID SCALE: 1:1500
            </span>
          </div>
          
          <div className="flex-1 bg-slate-950/80 rounded-xl relative overflow-hidden border border-cardBorder flex items-center justify-center p-4">
            {/* SVG Traffic Intersection Map Grid */}
            <svg viewBox="0 0 800 450" className="w-full h-full text-slate-800 opacity-90">
              {/* Roads drawing grid */}
              <line x1="200" y1="0" x2="200" y2="450" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="60" />
              <line x1="600" y1="0" x2="600" y2="450" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="60" />
              <line x1="0" y1="225" x2="800" y2="225" stroke="rgba(30, 41, 59, 0.4)" strokeWidth="60" />
              
              {/* Road Lane Markings */}
              <line x1="200" y1="0" x2="200" y2="450" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 10" />
              <line x1="600" y1="0" x2="600" y2="450" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 10" />
              <line x1="0" y1="225" x2="800" y2="225" stroke="#f59e0b" strokeWidth="2" strokeDasharray="10 10" />

              {/* Waterway Canal */}
              <path d="M 0,50 Q 200,80 400,60 T 800,100" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="25" />

              {/* Grid Text labels */}
              <text x="40" y="210" fill="rgba(255,255,255,0.2)" fontSize="12" fontWeight="bold">EXP-WY L2</text>
              <text x="220" y="30" fill="rgba(255,255,255,0.2)" fontSize="12" fontWeight="bold">MAIN AVE N</text>
              <text x="620" y="30" fill="rgba(255,255,255,0.2)" fontSize="12" fontWeight="bold">TECH LOOP</text>
            </svg>

            {/* Render absolute map pins for each telemetry junction node */}
            {telemetry.map((junction, index) => {
              // Map mock positions onto SVG canvas coordinates
              const positions = [
                { x: '25%', y: '50%' }, // Junction Alpha (intersection of 200, 225)
                { x: '75%', y: '50%' }, // Junction Beta (intersection of 600, 225)
                { x: '25%', y: '25%' }, // Junction Gamma
                { x: '75%', y: '75%' }  // Junction Delta
              ];
              
              const pos = positions[index] || { x: '50%', y: '50%' };
              const score = junction.congestion_score || 0;
              
              let markerColor = 'bg-emeraldSuccess border-emeraldSuccess/30';
              if (score > 75) markerColor = 'bg-roseEmergency border-roseEmergency/30';
              else if (score > 45) markerColor = 'bg-amberWarning border-amberWarning/30';

              if (junction.state === 'EMERGENCY_GREEN') {
                markerColor = 'bg-roseEmergency border-roseEmergency/80 scale-125 ring-4 ring-roseEmergency/40 animate-ping';
              }

              return (
                <button
                  key={junction.id}
                  onClick={() => handleJunctionClick(junction)}
                  className="absolute group flex flex-col items-center"
                  style={{ left: pos.x, top: pos.y, transform: 'translate(-50%, -50%)' }}
                >
                  {/* Glowing Signal dot */}
                  <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center cursor-pointer transition-all duration-300 ${markerColor} active-map-marker`} />
                  
                  {/* Tooltip Panel */}
                  <div className="absolute bottom-7 opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-48 p-2.5 rounded-xl bg-slate-900/95 border border-cardBorder shadow-glass text-left pointer-events-none z-10">
                    <p className="text-xs font-bold text-white">{junction.name}</p>
                    <div className="flex justify-between items-center mt-1.5 text-[10px]">
                      <span className="text-slate-400">Congestion:</span>
                      <span className={`font-semibold ${score > 75 ? 'text-roseEmergency' : score > 45 ? 'text-amberWarning' : 'text-emeraldSuccess'}`}>{score}%</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] mt-0.5">
                      <span className="text-slate-400">Light State:</span>
                      <span className="font-semibold text-cyanGlow">{junction.state}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Real-time Traffic graph */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[420px]">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">Live Congestion Curve</h4>
            <p className="text-xs text-slate-400">Analytical trends (24H distribution)</p>
          </div>
          <div className="flex-1 min-h-0 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCongestion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.2)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="congestion" stroke="#06B6D4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCongestion)" name="Congestion Index" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 3. Bottom Table Grid (Active Alerts Ticker) */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide">Emergency System Incidents Log</h4>
            <p className="text-xs text-slate-400">Audit listings of automated triggers and signals overrides</p>
          </div>
          <button 
            onClick={() => setActiveTab('alerts')} 
            className="text-xs text-cyanGlow font-semibold hover:underline flex items-center gap-1"
          >
            <span>View Alerts Center</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-cardBorder text-slate-400 font-medium">
                <th className="pb-3 text-xs uppercase tracking-wider">Time</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Junction</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Alert Type</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Details</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Priority</th>
                <th className="pb-3 text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardBorder/40">
              {alerts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-slate-500 text-xs">
                    No active emergency incidents logged.
                  </td>
                </tr>
              ) : (
                alerts.slice(0, 5).map((alert) => (
                  <tr key={alert.id} className="hover:bg-white/5 transition-colors duration-150">
                    <td className="py-3 text-xs font-mono text-slate-400">
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </td>
                    <td className="py-3 font-semibold text-white">
                      {telemetry.find(t => t.id === alert.junction_id)?.name || 'Central Grid'}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        alert.alert_type === 'AMBULANCE_DETECTED' 
                          ? 'bg-roseEmergency/15 text-roseEmergency border border-roseEmergency/20' 
                          : 'bg-amberWarning/15 text-amberWarning border border-amberWarning/20'
                      }`}>
                        {alert.alert_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-xs text-slate-300 max-w-xs truncate">
                      {alert.message}
                    </td>
                    <td className="py-3">
                      <span className={`text-[10px] font-semibold uppercase ${
                        alert.severity === 'CRITICAL' ? 'text-roseEmergency font-bold' : 'text-amberWarning'
                      }`}>
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 text-xs ${
                        alert.status === 'UNRESOLVED' 
                          ? 'text-roseEmergency font-semibold animate-pulse' 
                          : 'text-emeraldSuccess'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          alert.status === 'UNRESOLVED' ? 'bg-roseEmergency animate-ping' : 'bg-emeraldSuccess'
                        }`} />
                        {alert.status}
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
