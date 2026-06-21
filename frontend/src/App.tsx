import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { Dashboard } from './pages/Dashboard';
import { LiveMonitoring } from './pages/LiveMonitoring';
import { TrafficAnalytics } from './pages/TrafficAnalytics';
import { AmbulanceTracking } from './pages/AmbulanceTracking';
import { SmartSignalMgmt } from './pages/SmartSignalMgmt';
import { AlertsCenter } from './pages/AlertsCenter';
import { Reports } from './pages/Reports';
import { Login } from './pages/Login';
import { ShieldAlert, Volume2 } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isWsConnected, setIsWsConnected] = useState<boolean>(false);
  const [selectedJunction, setSelectedJunction] = useState<any>(null);
  
  // Primary telemetry states
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [priorityLogs, setPriorityLogs] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    active_junctions: 4,
    active_alerts: 0,
    priority_incidents: 0,
    total_vehicles_processed: 0,
    average_congestion_score: 0,
    vehicle_distribution: { Car: 0, Bus: 0, Bike: 0, Truck: 0, Auto: 0, Ambulance: 0 }
  });
  
  // Real-time chart history
  const [chartData, setChartData] = useState<any[]>([]);
  
  // Live Toast notifications for active ambulances
  const [toastNotification, setToastNotification] = useState<any>(null);
  
  const wsRef = useRef<WebSocket | null>(null);

  // Authenticate user via cached tokens on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem('iscts_user');
    const cachedToken = localStorage.getItem('iscts_token');
    if (cachedUser && cachedToken) {
      setUser(JSON.parse(cachedUser));
      setToken(cachedToken);
    }
  }, []);

  // Fetch initial telemetry records
  const fetchTelemetryData = async () => {
    try {
      const jRes = await fetch('/api/signal/junctions');
      if (jRes.ok) {
        const data = await jRes.json();
        const mappedData = data.map((j: any) => ({
          ...j,
          congestion_score: j.state === 'EMERGENCY_GREEN' ? 85 : Math.floor(Math.random() * 50) + 15,
          lane_metrics: {
            NORTH: { car: 12, bus: 2, bike: 8, truck: 1, auto: 3, ambulance: 0, congestion: 35, density: 'LOW' },
            EAST: { car: 18, bus: 1, bike: 10, truck: 2, auto: 4, ambulance: 0, congestion: 45, density: 'MEDIUM' },
            SOUTH: { car: 25, bus: 4, bike: 15, truck: 3, auto: 6, ambulance: 0, congestion: 65, density: 'MEDIUM' },
            WEST: { car: 15, bus: 3, bike: 10, truck: 2, auto: 4, ambulance: 0, congestion: 42, density: 'MEDIUM' }
          }
        }));
        setTelemetry(mappedData);
      }
      
      const aRes = await fetch('/api/analytics/alerts');
      if (aRes.ok) setAlerts(await aRes.json());
      
      const sRes = await fetch('/api/analytics/summary');
      if (sRes.ok) setSummary(await sRes.json());
      
      const pRes = await fetch('/api/analytics/priority-logs');
      if (pRes.ok) setPriorityLogs(await pRes.json());
      
      const hRes = await fetch('/api/analytics/history');
      if (hRes.ok) setChartData(await hRes.json());
    } catch (err) {
      console.warn("Backend API nodes offline. Running dashboard in fallback simulation mode.");
      initializeMockTelemetry();
    }
  };

  const initializeMockTelemetry = () => {
    // Generate initial high-quality mock data for independent front-end rendering
    const mockJunctions = [
      { id: 'j1', name: 'Junction Alpha (North Grid)', location_lat: 12.971598, location_lng: 77.594562, state: 'GREEN', cycle_duration: 35, current_green_lane: 'NORTH', adaptive_mode: true, status: 'ACTIVE', congestion_score: 42 },
      { id: 'j2', name: 'Junction Beta (Commercial St)', location_lat: 12.981598, location_lng: 77.604562, state: 'RED', cycle_duration: 48, current_green_lane: 'EAST', adaptive_mode: true, status: 'ACTIVE', congestion_score: 68 },
      { id: 'j3', name: 'Junction Gamma (Ring Road)', location_lat: 12.951598, location_lng: 77.584562, state: 'RED', cycle_duration: 62, current_green_lane: 'SOUTH', adaptive_mode: true, status: 'ACTIVE', congestion_score: 25 },
      { id: 'j4', name: 'Junction Delta (Tech Park)', location_lat: 12.991598, location_lng: 77.614562, state: 'YELLOW', cycle_duration: 5, current_green_lane: 'WEST', adaptive_mode: true, status: 'ACTIVE', congestion_score: 55 }
    ];
    setTelemetry(mockJunctions);

    const mockAlerts = [
      { id: 'a1', alert_type: 'HEAVY_CONGESTION', message: 'Heavy congestion detected on Junction Alpha Eastbound (85% congestion score)', severity: 'WARNING', junction_id: 'j1', lane: 'EAST', status: 'UNRESOLVED', created_at: new Date(Date.now() - 600000).toISOString() },
      { id: 'a2', alert_type: 'ACCIDENT_DETECTED', message: 'Potential accident incident detected at Junction Beta (Northbound lane block)', severity: 'CRITICAL', junction_id: 'j2', lane: 'NORTH', status: 'UNRESOLVED', created_at: new Date(Date.now() - 120000).toISOString() }
    ];
    setAlerts(mockAlerts);

    setSummary({
      active_junctions: 4,
      active_alerts: 2,
      priority_incidents: 1,
      total_vehicles_processed: 894,
      average_congestion_score: 47,
      vehicle_distribution: { Car: 540, Bus: 68, Bike: 182, Truck: 24, Auto: 76, Ambulance: 4 }
    });

    const mockHistory = Array.from({ length: 12 }, (_, i) => {
      const hour = 8 + i;
      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        vehicles: Math.floor(Math.random() * 200) + 100,
        congestion: Math.floor(Math.random() * 50) + 25
      };
    });
    setChartData(mockHistory);
  };

  useEffect(() => {
    if (user) {
      fetchTelemetryData();
      connectWebSocket();
    }
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [user]);

  // Connect WebSockets
  const connectWebSocket = () => {
    const wsScheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsHost = window.location.host;
    const wsUrl = `${wsScheme}//${wsHost}/ws/telemetry`;
    
    // Developer fallback mapping
    const socket = new WebSocket(wsRef.current ? wsUrl : 'ws://localhost:8000/ws/telemetry');
    wsRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket telemetry stream connected.");
      setIsWsConnected(true);
    };

    socket.onclose = () => {
      console.warn("WebSocket telemetry channel closed. Retrying connection in 5s...");
      setIsWsConnected(false);
      setTimeout(connectWebSocket, 5000);
    };

    socket.onmessage = (event) => {
      const packet = JSON.parse(event.data);
      if (packet.type === 'TELEMETRY_UPDATE') {
        setTelemetry(packet.data);
        
        // Update live summary
        const totalPro = packet.data.reduce((acc: number, curr: any) => acc + curr.congestion_score * 5, 0);
        setSummary((prev: any) => ({
          ...prev,
          total_vehicles_processed: prev.total_vehicles_processed + 4,
          average_congestion_score: Math.round(packet.data.reduce((acc: number, curr: any) => acc + curr.congestion_score, 0) / packet.data.length)
        }));
      } else if (packet.type === 'EMERGENCY_TRIGGER') {
        // Trigger Toast alarm
        setToastNotification({
          title: "EMERGENCY VEHICLE INJECTION",
          message: `Ambulance ${packet.data.ambulance_id} detected at ${packet.data.junction_name}. Lane green lock initiated!`,
          data: packet.data
        });
        
        // Auto resolve toast after 6 seconds
        setTimeout(() => setToastNotification(null), 6000);
        fetchTelemetryData(); // refresh tables
      } else if (packet.type === 'EMERGENCY_CLEAR') {
        setToastNotification(null);
        fetchTelemetryData();
      }
    };
  };

  // Fallback local simulation updates loop (Triggered if WebSocket remains disconnected)
  useEffect(() => {
    if (isWsConnected || !user) return;
    
    const interval = setInterval(() => {
      // Simulate timers descending
      setTelemetry((prev) => 
        prev.map((j) => {
          let nextState = j.state;
          let nextGreen = j.current_green_lane;
          let nextTimer = j.cycle_duration - 1;

          if (j.state === 'EMERGENCY_GREEN') {
            // Keep override locked
            return j;
          }

          if (nextTimer <= 0) {
            if (j.state === 'GREEN') {
              nextState = 'YELLOW';
              nextTimer = 5;
            } else {
              nextState = 'GREEN';
              const progression = ['NORTH', 'EAST', 'SOUTH', 'WEST'];
              const idx = progression.indexOf(j.current_green_lane);
              nextGreen = progression[(idx + 1) % 4];
              nextTimer = Math.floor(Math.random() * 40) + 20;
            }
          }
          
          return {
            ...j,
            state: nextState,
            current_green_lane: nextGreen,
            cycle_duration: nextTimer,
            congestion_score: Math.max(10, Math.min(95, j.congestion_score + (Math.random() - 0.5) * 6))
          };
        })
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [isWsConnected, user]);

  // Priority Control Actions
  const handleTriggerAmbulance = async (junctionId: string, lane: string) => {
    try {
      const response = await fetch('/api/signal/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ambulance_id: 'AMB-TEST-MOCK',
          junction_id: junctionId,
          lane: lane,
          duration_seconds: 15
        })
      });
      if (response.ok) {
        fetchTelemetryData();
      }
    } catch (err) {
      // Client-side local simulation override fallback
      setTelemetry((prev) => 
        prev.map((j) => 
          j.id === junctionId 
            ? { ...j, state: 'EMERGENCY_GREEN', current_green_lane: lane, cycle_duration: 15, adaptive_mode: false } 
            : j
        )
      );

      // Add emergency system alert
      const newAlert = {
        id: `mock-alert-${Date.now()}`,
        alert_type: 'AMBULANCE_DETECTED',
        message: `Emergency Priority Mode: Ambulance AMB-TEST-MOCK active on ${lane} lane approach.`,
        severity: 'CRITICAL',
        junction_id: junctionId,
        lane: lane,
        status: 'UNRESOLVED',
        created_at: new Date().toISOString()
      };
      setAlerts(prev => [newAlert, ...prev]);
      
      // Update summary counts
      setSummary((prev: any) => ({
        ...prev,
        active_alerts: prev.active_alerts + 1,
        priority_incidents: prev.priority_incidents + 1
      }));

      // Render overlay Toast
      setToastNotification({
        title: "LOCAL OVERRIDE ACTIVE",
        message: `Emergency green clearance triggered manually for ${lane} lane.`,
        data: { junction_id: junctionId, lane }
      });
      setTimeout(() => setToastNotification(null), 5000);
    }
  };

  const handleClearOverride = async (junctionId: string) => {
    try {
      const response = await fetch('/api/signal/override/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ junction_id: junctionId })
      });
      if (response.ok) fetchTelemetryData();
    } catch (err) {
      setTelemetry((prev) => 
        prev.map((j) => 
          j.id === junctionId 
            ? { ...j, state: 'GREEN', adaptive_mode: true, cycle_duration: 30 } 
            : j
        )
      );
      // Resolve ambulance alert
      setAlerts(prev => 
        prev.map(a => a.junction_id === junctionId && a.alert_type === 'AMBULANCE_DETECTED' ? { ...a, status: 'RESOLVED' } : a)
      );
    }
  };

  const handleUpdateJunction = async (configs: any) => {
    try {
      const response = await fetch('/api/signal/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configs)
      });
      if (response.ok) fetchTelemetryData();
    } catch (err) {
      setTelemetry((prev) => 
        prev.map((j) => j.id === configs.id ? { ...j, ...configs } : j)
      );
    }
  };

  const handleResolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/analytics/alerts/${alertId}/resolve`, {
        method: 'POST'
      });
      if (response.ok) fetchTelemetryData();
    } catch (err) {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, status: 'RESOLVED' } : a));
    }
  };

  const handleLoginSuccess = (userData: any, tokenData: string) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('iscts_user', JSON.stringify(userData));
    localStorage.setItem('iscts_token', tokenData);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('iscts_user');
    localStorage.removeItem('iscts_token');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            telemetry={telemetry}
            alerts={alerts}
            summary={summary}
            chartData={chartData}
            setSelectedJunction={setSelectedJunction}
            setActiveTab={setActiveTab}
          />
        );
      case 'monitoring':
        return (
          <LiveMonitoring
            telemetry={telemetry}
            onTriggerAmbulance={handleTriggerAmbulance}
          />
        );
      case 'analytics':
        return <TrafficAnalytics summary={summary} chartData={chartData} />;
      case 'ambulance':
        return (
          <AmbulanceTracking
            telemetry={telemetry}
            priorityLogs={priorityLogs}
            onClearOverride={handleClearOverride}
            userRole={user.role}
          />
        );
      case 'signal':
        return (
          <SmartSignalMgmt
            telemetry={telemetry}
            onUpdateJunction={handleUpdateJunction}
            selectedJunction={selectedJunction}
            setSelectedJunction={setSelectedJunction}
            userRole={user.role}
          />
        );
      case 'alerts':
        return (
          <AlertsCenter
            alerts={alerts}
            onResolveAlert={handleResolveAlert}
            userRole={user.role}
          />
        );
      case 'reports':
        return <Reports telemetry={telemetry} />;
      default:
        return <Dashboard telemetry={telemetry} alerts={alerts} summary={summary} chartData={chartData} setSelectedJunction={setSelectedJunction} setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex">
      {/* 1. Main Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user} 
        onLogout={handleLogout} 
      />

      {/* 2. Primary layout body wrapper */}
      <div className="flex-1 pl-64">
        {/* Top Navbar */}
        <Navbar 
          activeTab={activeTab} 
          isWsConnected={isWsConnected} 
          unresolvedAlertsCount={alerts.filter(a => a.status === 'UNRESOLVED').length}
          triggerManualSync={fetchTelemetryData}
        />

        {/* Dynamic sub-view portal */}
        <main className="pt-28 pb-12 px-8 max-w-7xl mx-auto">
          {renderActiveTab()}
        </main>
      </div>

      {/* 3. Global Siren Audio Notification Dialog Overlay */}
      {toastNotification && (
        <div className="fixed bottom-6 right-6 z-50 w-96 glass-panel border border-roseEmergency bg-roseEmergency/5 p-5 rounded-2xl shadow-neonRose animate-bounce">
          <div className="flex gap-4">
            <div className="p-3 rounded-xl bg-roseEmergency/20 text-roseEmergency border border-roseEmergency/40 animate-ping h-fit">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="font-extrabold text-sm text-white tracking-wide">{toastNotification.title}</h5>
              <p className="text-xs text-roseEmergency font-semibold mt-1 leading-relaxed">{toastNotification.message}</p>
              <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-mono">
                <span>PRIORITY LOCKED: GREEN</span>
                <span>SIREN DETECTED</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
