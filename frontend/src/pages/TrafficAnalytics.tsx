import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie, Legend, LineChart, Line
} from 'recharts';
import { BarChart3, PieChart as PieIcon, LineChart as LineIcon, CalendarDays } from 'lucide-react';

interface TrafficAnalyticsProps {
  summary: any;
  chartData: any[];
}

export const TrafficAnalytics: React.FC<TrafficAnalyticsProps> = ({ summary, chartData }) => {
  const [timeframe, setTimeframe] = useState<string>('24h');

  // Format data for Pie Chart from summary
  const pieData = summary.vehicle_distribution 
    ? Object.entries(summary.vehicle_distribution).map(([name, value]) => ({ name, value }))
    : [
        { name: 'Car', value: 425 },
        { name: 'Bike', value: 212 },
        { name: 'Bus', value: 54 },
        { name: 'Truck', value: 18 },
        { name: 'Auto', value: 88 },
        { name: 'Ambulance', value: 3 }
      ];

  const PIE_COLORS = ['#06B6D4', '#3B82F6', '#F59E0B', '#EF4444', '#10B981', '#8B5CF6'];

  // Mock junction volume comparison data
  const junctionVolumes = [
    { name: 'Jct Alpha', volume: 840, density: 72 },
    { name: 'Jct Beta', volume: 620, density: 48 },
    { name: 'Jct Gamma', volume: 510, density: 55 },
    { name: 'Jct Delta', volume: 780, density: 68 }
  ];

  return (
    <div className="space-y-6">
      {/* Timeframe Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Metrics Analytics Control</h3>
          <p className="text-xs text-slate-400">Review peak trends, traffic volumes, and vehicle classification ratios.</p>
        </div>
        
        <div className="flex bg-white/5 border border-cardBorder p-1.5 rounded-xl gap-1">
          {['24h', '7d', '30d'].map((time) => (
            <button
              key={time}
              onClick={() => setTimeframe(time)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all uppercase ${
                timeframe === time 
                  ? 'bg-cyanGlow text-slate-950 font-extrabold shadow-neonCyan' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {time}
            </button>
          ))}
        </div>
      </div>

      {/* Primary analytics graph grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graph 1: Area volume trend */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <div className="flex items-center gap-2 mb-4">
            <LineIcon className="w-5 h-5 text-cyanGlow" />
            <h4 className="text-sm font-bold text-white">Hourly Vehicle Flow Volume</h4>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.2)" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="vehicles" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorVehicles)" name="Vehicle Density" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 2: Bar charts junction load volume */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-amberWarning" />
            <h4 className="text-sm font-bold text-white">Junction Density Index (Average)</h4>
          </div>
          <div className="flex-1 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={junctionVolumes} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(30, 41, 59, 0.2)" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                />
                <Bar dataKey="density" radius={[6, 6, 0, 0]} name="Congestion Average (%)">
                  {junctionVolumes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.density > 70 ? '#EF4444' : entry.density > 50 ? '#F59E0B' : '#06B6D4'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graph 3: Pie Chart vehicle breakdown */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px]">
          <div className="flex items-center gap-2 mb-4">
            <PieIcon className="w-5 h-5 text-emeraldSuccess" />
            <h4 className="text-sm font-bold text-white">Vehicle Category Breakdown Ratio</h4>
          </div>
          <div className="flex-1 min-h-0 flex items-center justify-center">
            <div className="w-full h-full flex flex-col md:flex-row items-center justify-around">
              <div className="w-64 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111827', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend Legend */}
              <div className="grid grid-cols-2 md:grid-cols-1 gap-2.5 mt-4 md:mt-0">
                {pieData.map((item, index) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm text-slate-300">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className="font-medium">{item.name}:</span>
                    <span className="text-slate-400 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Peak Hours Matrix info box */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col h-[380px] justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CalendarDays className="w-5 h-5 text-cyanGlow" />
              <h4 className="text-sm font-bold text-white">Peak Analytics Summary</h4>
            </div>
            <p className="text-xs text-slate-400">Statistical data computed on cumulative historical traffic records.</p>
          </div>

          <div className="space-y-4 my-auto">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Morning Rush Hour</p>
                <p className="text-lg font-bold text-white mt-1">08:00 AM - 10:30 AM</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-roseEmergency/15 text-roseEmergency border border-roseEmergency/20 rounded-lg">HEAVY LOAD</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Evening Rush Hour</p>
                <p className="text-lg font-bold text-white mt-1">05:30 PM - 08:00 PM</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-roseEmergency/15 text-roseEmergency border border-roseEmergency/20 rounded-lg">HEAVY LOAD</span>
            </div>

            <div className="p-4 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Weekly Maximum Peak Day</p>
                <p className="text-lg font-bold text-white mt-1">Friday Afternoon</p>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 bg-amberWarning/15 text-amberWarning border border-amberWarning/20 rounded-lg">MODERATE</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono text-center">Calculations computed dynamically. Updated weekly.</p>
        </div>
      </div>
    </div>
  );
};
