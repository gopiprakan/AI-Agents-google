import React, { useEffect, useRef, useState } from 'react';
import { Camera, Video, AlertTriangle, Eye, EyeOff, Sliders, HelpCircle } from 'lucide-react';

interface LiveMonitoringProps {
  telemetry: any[];
  onTriggerAmbulance: (junctionId: string, lane: string) => void;
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ telemetry, onTriggerAmbulance }) => {
  const [selectedJunctionId, setSelectedJunctionId] = useState<string>('');
  const [selectedLane, setSelectedLane] = useState<string>('NORTH');
  const [showBoxes, setShowBoxes] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [alerts, setAlerts] = useState<string[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Set default junction
  useEffect(() => {
    if (telemetry.length && !selectedJunctionId) {
      setSelectedJunctionId(telemetry[0].id);
    }
  }, [telemetry, selectedJunctionId]);

  // Handle Recording Timer
  useEffect(() => {
    let interval: any = null;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingSeconds(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const activeJunction = telemetry.find(t => t.id === selectedJunctionId) || telemetry[0];

  // Draw Camera Feed & Bounding Boxes Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    // Create animated vehicles for rendering
    const vehicles: any[] = [];
    for (let i = 0; i < 12; i++) {
      vehicles.push({
        id: i,
        x: Math.random() * (canvas.width - 80) + 40,
        y: Math.random() * (canvas.height - 80) + 40,
        speedX: (Math.random() - 0.5) * 3,
        speedY: (Math.random() - 0.5) * 3,
        type: ['Car', 'Bike', 'Auto', 'Bus', 'Truck'][Math.floor(Math.random() * 5)],
        conf: 0.7 + Math.random() * 0.28
      });
    }

    // Add ambulance to list if active lane is under emergency
    const isEmergency = activeJunction?.state === 'EMERGENCY_GREEN' && activeJunction?.current_green_lane === selectedLane;
    if (isEmergency) {
      vehicles.push({
        id: 'amb',
        x: canvas.width / 2,
        y: canvas.height / 2 + Math.sin(Date.now() / 150) * 30,
        speedX: 0,
        speedY: 0,
        type: 'Ambulance',
        conf: 0.99
      });
    }

    const render = () => {
      // Clear
      ctx.fillStyle = '#0b0f19';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw virtual asphalt road lanes grid
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      // Draw cross roads
      ctx.strokeRect(40, 40, canvas.width - 80, canvas.height - 80);
      
      // Lane dividers
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 0); ctx.lineTo(canvas.width / 2, canvas.height);
      ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw visual overlay guides
      ctx.fillStyle = 'rgba(6, 182, 212, 0.03)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw visual text info overlays
      ctx.font = '10px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText(`STREAM HOST: RTSP://10.244.52.${selectedLane === 'NORTH' ? 1 : selectedLane === 'EAST' ? 2 : selectedLane === 'SOUTH' ? 3 : 4}:554/live`, 15, 25);
      ctx.fillText(`FPS: 30.00 | DIMS: 640x480 | AI MODULE: YOLOv8n`, 15, 40);
      
      // Draw target indicator
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      // Draw active vehicles boxes
      vehicles.forEach(v => {
        // Update positions (bounce on borders)
        if (v.id !== 'amb') {
          v.x += v.speedX;
          v.y += v.speedY;
          if (v.x < 30 || v.x > canvas.width - 60) v.speedX *= -1;
          if (v.y < 30 || v.y > canvas.height - 60) v.speedY *= -1;
        }

        const width = v.type === 'Bus' || v.type === 'Truck' ? 75 : v.type === 'Bike' ? 30 : 50;
        const height = v.type === 'Bus' ? 45 : v.type === 'Bike' ? 25 : 35;

        // Box properties based on vehicle type
        let boxColor = '#06B6D4'; // cyan
        if (v.type === 'Ambulance') boxColor = '#EF4444'; // emergency red
        else if (v.type === 'Bus' || v.type === 'Truck') boxColor = '#F59E0B'; // amber

        if (showBoxes) {
          ctx.strokeStyle = boxColor;
          ctx.lineWidth = v.type === 'Ambulance' ? 3 : 2;
          ctx.strokeRect(v.x, v.y, width, height);

          // Centroid dot
          ctx.fillStyle = boxColor;
          ctx.beginPath();
          ctx.arc(v.x + width/2, v.y + height/2, 3, 0, 2*Math.PI);
          ctx.fill();
        }

        if (showLabels) {
          ctx.fillStyle = boxColor;
          ctx.font = 'bold 9px Inter';
          const labelText = `${v.type} (${Math.round(v.conf * 100)}%)`;
          ctx.fillRect(v.x, v.y - 14, ctx.measureText(labelText).width + 8, 14);
          ctx.fillStyle = '#ffffff';
          ctx.fillText(labelText, v.x + 4, v.y - 4);
        }
      });

      // Blinking Emergency Alert Ring on Feed
      if (isEmergency) {
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 10;
        ctx.setLineDash([20, 10]);
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        ctx.setLineDash([]);
        
        ctx.fillStyle = 'rgba(239, 68, 68, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 16px Poppins';
        ctx.fillText('EMERGENCY VEHICLE DETECTED - OVERRIDE ACTIVE', canvas.width / 2 - 200, 45);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedJunctionId, selectedLane, showBoxes, showLabels, activeJunction]);

  // Capture image snapshot
  const takeSnapshot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `ISCTS_Snapshot_${activeJunction?.name.replace(/ /g, '_')}_${selectedLane}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Register temporary notification
    const alertMsg = `Snapshot captured successfully for ${activeJunction?.name} (${selectedLane} Lane)`;
    setAlerts(prev => [alertMsg, ...prev.slice(0, 4)]);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setAlerts(prev => ["RTSP streaming recording initialized.", ...prev.slice(0, 4)]);
    } else {
      setAlerts(prev => [`Recording files saved as ISCTS_Capture_${recordingSeconds}s.mp4`, ...prev.slice(0, 4)]);
    }
  };

  const injectAmbulance = () => {
    if (!selectedJunctionId) return;
    onTriggerAmbulance(selectedJunctionId, selectedLane);
    setAlerts(prev => [`Simulated emergency vehicle dispatched onto ${selectedLane} lane.`, ...prev.slice(0, 4)]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* 1. Interactive canvas stream panel */}
      <div className="glass-panel p-6 rounded-2xl lg:col-span-2 flex flex-col h-[580px]">
        {/* Stream metadata */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide">
              {activeJunction?.name || 'Loading Junction...'} - {selectedLane} Lane Camera Feed
            </h3>
            <p className="text-xs text-slate-400">YOLOv8 AI Detection Layer (Processed Real-Time)</p>
          </div>

          <div className="flex items-center gap-3">
            {isRecording && (
              <span className="flex items-center gap-1.5 text-xs text-roseEmergency font-semibold animate-pulse bg-roseEmergency/15 border border-roseEmergency/20 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-roseEmergency" />
                REC {String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')}
              </span>
            )}
            <span className="w-2.5 h-2.5 rounded-full bg-emeraldSuccess animate-pulse" />
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">FEED ACTIVE</span>
          </div>
        </div>

        {/* The canvas */}
        <div className="flex-1 bg-slate-950 rounded-xl relative overflow-hidden border border-cardBorder flex items-center justify-center">
          <canvas 
            ref={canvasRef} 
            width={640} 
            height={480} 
            className="w-full h-full object-contain max-h-[420px]"
          />
        </div>

        {/* Video stream buttons bar */}
        <div className="flex justify-between items-center mt-4">
          <div className="flex items-center gap-3">
            <button
              onClick={takeSnapshot}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-white/5 hover:bg-white/10 hover:border-slate-500 text-sm font-semibold transition-all duration-200"
            >
              <Camera className="w-4 h-4 text-cyanGlow" />
              <span>Snapshot</span>
            </button>
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all duration-200 ${
                isRecording 
                  ? 'bg-roseEmergency/10 border-roseEmergency text-roseEmergency hover:bg-roseEmergency/25' 
                  : 'bg-white/5 border-slate-700 text-white hover:bg-white/10 hover:border-slate-500'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>{isRecording ? 'Stop Recording' : 'Record Feed'}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBoxes(!showBoxes)}
              className={`p-2.5 rounded-xl border text-xs ${showBoxes ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow' : 'bg-white/5 border-slate-700 text-slate-400'}`}
              title="Toggle Bounding Boxes"
            >
              {showBoxes ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setShowLabels(!showLabels)}
              className={`p-2.5 rounded-xl border text-xs ${showLabels ? 'bg-cyanGlow/10 border-cyanGlow/30 text-cyanGlow' : 'bg-white/5 border-slate-700 text-slate-400'}`}
              title="Toggle Class Labels"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Control selection panels and trigger logs */}
      <div className="space-y-6">
        {/* Stream Selector Card */}
        <div className="glass-panel p-6 rounded-2xl">
          <h4 className="text-sm font-bold text-white mb-4">Select Target Feed</h4>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Select Junction Node</label>
              <select
                value={selectedJunctionId}
                onChange={(e) => setSelectedJunctionId(e.target.value)}
                className="w-full bg-slate-900 border border-cardBorder rounded-xl px-4 py-3 text-sm text-slate-200 outline-none focus:border-cyanGlow transition-colors"
              >
                {telemetry.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-2">Lane Direction Approach</label>
              <div className="grid grid-cols-4 gap-2">
                {['NORTH', 'EAST', 'SOUTH', 'WEST'].map((lane) => (
                  <button
                    key={lane}
                    onClick={() => setSelectedLane(lane)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all duration-200 ${
                      selectedLane === lane 
                        ? 'bg-cyanGlow/15 border-cyanGlow text-cyanGlow font-extrabold glow-cyan' 
                        : 'bg-white/5 border-slate-800 text-slate-400 hover:bg-white/10'
                    }`}
                  >
                    {lane.slice(0, 1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Priority Emergency Injector */}
        <div className="glass-panel p-6 rounded-2xl border border-roseEmergency/10 relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-3 -translate-y-3 opacity-5">
            <AlertTriangle className="w-24 h-24 text-roseEmergency" />
          </div>
          
          <h4 className="text-sm font-bold text-white mb-2">Emergency Override Test Module</h4>
          <p className="text-xs text-slate-400 mb-4">Click below to simulate a high-priority Ambulance detection trigger in the current camera frame zone.</p>
          
          <button
            onClick={injectAmbulance}
            disabled={activeJunction?.state === 'EMERGENCY_GREEN'}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-roseEmergency/30 text-roseEmergency bg-roseEmergency/5 hover:bg-roseEmergency/15 transition-all duration-200 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
          >
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <span>Simulate Ambulance</span>
          </button>
        </div>

        {/* Session feed Event Logs */}
        <div className="glass-panel p-6 rounded-2xl h-[230px] flex flex-col">
          <h4 className="text-sm font-bold text-white mb-3">Live Session Activity Logs</h4>
          <div className="flex-1 overflow-y-auto space-y-2.5 font-mono text-xs">
            {alerts.length === 0 ? (
              <p className="text-slate-500 text-center py-8">Idle. No session triggers recorded.</p>
            ) : (
              alerts.map((a, i) => (
                <div key={i} className="flex gap-2 text-slate-300 items-start border-l border-slate-800 pl-2">
                  <span className="text-cyanGlow font-semibold">&gt;</span>
                  <span>{a}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
