import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin, LogOut, Grid3x3, Activity,
  AlertTriangle, Cpu, BarChart3, Shield, Sparkles, Bot
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTelemetry } from "@/hooks/useTelemetry";
import { useMockTelemetry } from "@/hooks/useMockTelemetry";
import DeviceCard from "@/components/DeviceCard";
import CrackDetailModal from "@/components/CrackDetailModal";
import DeviceCracksModal from "@/components/DeviceCracksModal";
import BottomNav from "@/components/BottomNav";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL;       // e.g. /e21-3yp-RAID/webapp/

export default function Dashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [selectedCrack, setSelectedCrack] = useState<any>(null);
  const [showCrackDetail, setShowCrackDetail] = useState(false);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('crackStatusOverrides');
    return saved ? JSON.parse(saved) : {};
  });

  React.useEffect(() => {
    localStorage.setItem('crackStatusOverrides', JSON.stringify(statusOverrides));
  }, [statusOverrides]);

  const getCrackKey = (c: any) => c.id?.toString() || c.timestamp?.toString();

  const applyOverrides = (cracks: any[]) => cracks.map(c => {
    const key = getCrackKey(c);
    return { ...c, status: (key && statusOverrides[key]) ? statusOverrides[key] : c.status };
  });

  const sensorLeft   = useTelemetry("esp-001", "LEFT");
  const sensorRight  = useTelemetry("esp-001", "RIGHT");
  const sensorCenter = useTelemetry("esp-001", "CENTER");
  const sensorHeartbeat = useTelemetry("esp-001", "HEARTBEAT");

  const device1Raw = applyOverrides([
    ...sensorLeft.liveCracks,
    ...sensorRight.liveCracks,
    ...sensorCenter.liveCracks,
  ].sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime()));

  const isHeartbeat = (c: any) =>
    c.crackDetected === false || c.status === 'HEARTBEAT' || c.status === 'NOMINAL_HEARTBEAT';

  const device1 = {
    liveCracks: device1Raw.filter((c: any) => !isHeartbeat(c)),
    heartbeats: device1Raw.filter(isHeartbeat),
    isConnected: sensorLeft.isConnected || sensorRight.isConnected || sensorCenter.isConnected,
  };

  const device2MockHook = useMockTelemetry("esp-002-mock", "IR_Bottom");
  const device3MockHook = useMockTelemetry("esp-003-mock", "IR_Bottom");

  const device2Raw = applyOverrides(device2MockHook.liveCracks);
  const device2 = {
    ...device2MockHook,
    liveCracks: device2Raw.filter((c: any) => !isHeartbeat(c)),
    heartbeats: device2Raw.filter(isHeartbeat),
  };

  const device3Raw = applyOverrides(device3MockHook.liveCracks);
  const device3 = {
    ...device3MockHook,
    liveCracks: device3Raw.filter((c: any) => !isHeartbeat(c)),
    heartbeats: device3Raw.filter(isHeartbeat),
  };

  const allHeartbeats = [
    ...sensorHeartbeat.liveCracks,
    ...device1.heartbeats,
    ...device2.heartbeats,
    ...device3.heartbeats,
  ]
    .filter(isHeartbeat)
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime())
    .filter((c, idx, arr) =>
      arr.findIndex(x => x.timestamp === c.timestamp && x.deviceId === c.deviceId) === idx
    );

  const totalCracks = device1.liveCracks.length + device2.liveCracks.length + device3.liveCracks.length;
  const totalCritical = [device1, device2, device3]
    .flatMap(d => d.liveCracks)
    .filter(c => c.status === 'approved' || c.status === 'confirmed').length;

  const device1Load = device1.liveCracks.length;
  const device2Load = device2.liveCracks.length;
  const device3Load = device3.liveCracks.length;

  const device1Percent = totalCracks > 0 ? Math.round((device1Load / totalCracks) * 100) : 0;
  const device2Percent = totalCracks > 0 ? Math.round((device2Load / totalCracks) * 100) : 0;
  const device3Percent = totalCracks > 0 ? Math.round((device3Load / totalCracks) * 100) : 0;

  const avgLoad = totalCracks > 0 ? Math.round(totalCracks / 3) : 0;
  const loadBalance = Math.round(
    ((Math.max(device1Load, device2Load, device3Load) - Math.min(device1Load, device2Load, device3Load))
     / Math.max(1, avgLoad)) * 100
  );
  const isBalanced = loadBalance < 30;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleViewDevice = (deviceId: string) => {
    setSelectedDevice(deviceId);
  };

  const handleCrackClick = (crack: any) => {
    setSelectedCrack(crack);
    setShowCrackDetail(true);
  };

  const handleCrackStatusUpdate = (crackId: string | number, newStatus: 'pending' | 'approved' | 'ignored') => {
    setStatusOverrides(prev => ({ ...prev, [crackId]: newStatus }));
    const selectedKey = getCrackKey(selectedCrack || {});
    if (selectedKey === crackId?.toString()) {
      setSelectedCrack({ ...selectedCrack, status: newStatus });
    }
  };

  const onlineCount = [device1, device2, device3].filter(d => d.isConnected).length;

  const getSelectedDeviceName = () => {
    if (selectedDevice === 'esp-001') return 'Robot-01';
    if (selectedDevice === 'esp-002-mock') return 'Robot-02';
    if (selectedDevice === 'esp-003-mock') return 'Robot-03';
    return selectedDevice || '';
  };

  const selectedDeviceCracks = selectedDevice
    ? [device1Raw, device2Raw, device3Raw].flat().filter((c: any) => c.deviceId === selectedDevice && !isHeartbeat(c))
    : [];

  return (
    <div className="min-h-screen bg-background pb-28 mesh-bg">

      {/* ═══════════ HERO / HEADER ═══════════ */}
      <div className="header-gradient px-5 pt-6 pb-6">

        {/* Decorative floating blobs */}
        <div className="absolute top-4 left-8 w-32 h-32 rounded-full bg-blue-400/20 blur-2xl float-slow pointer-events-none" />
        <div className="absolute top-16 right-4 w-24 h-24 rounded-full bg-cyan-400/15 blur-2xl float-slower pointer-events-none" />

        {/* Title row */}
        <div className="flex items-center justify-between mb-5 relative z-10">
          <div className="animate-fade-in-up">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-[10px] font-bold tracking-widest uppercase shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                Live System
              </span>
            </div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight leading-none">
              RailSafe Monitor
            </h1>
            <p className="text-[12px] text-blue-200/80 mt-1.5 font-medium tabular-nums">
              Track Inspection Dashboard · {new Date().toLocaleString()}
            </p>
          </div>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="ghost"
            className="text-blue-200 hover:text-white hover:bg-white/10 rounded-xl h-10 w-10 p-0 transition-all duration-200 hover:scale-105"
          >
            <LogOut size={18} />
          </Button>
        </div>

        {/* ─── Hero Image Banner ─── */}
        <div className="hero-image-section mb-5 relative z-10 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <img
            src={`${BASE}rail-hero.png`}
            alt="Railway inspection robot monitoring tracks"
          />
          <div className="hero-image-overlay" />
        </div>

        {/* ─── Key Metrics Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 relative z-10 stagger-children">
          {/* Total Detections */}
          <div className="glass-card-dark rounded-2xl px-4 py-4 border border-white/10 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-blue-500/20 rounded-lg">
                <Sparkles size={12} className="text-blue-400" />
              </div>
              <p className="text-[10px] text-blue-200/80 uppercase font-bold tracking-widest">Detections</p>
            </div>
            <p className="text-3xl font-extrabold text-white tabular-nums">{totalCracks}</p>
          </div>

          {/* Critical Alerts */}
          <div className="bg-rose-500/10 backdrop-blur-sm rounded-2xl px-4 py-4 border border-rose-500/20 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-rose-500/20 rounded-lg">
                <AlertTriangle size={12} className="text-rose-400" />
              </div>
              <p className="text-[10px] text-rose-300 uppercase font-bold tracking-widest">Critical</p>
            </div>
            <p className="text-3xl font-extrabold text-rose-400 tabular-nums">{totalCritical}</p>
          </div>

          {/* Active Fleet */}
          <div className="bg-emerald-500/10 backdrop-blur-sm rounded-2xl px-4 py-4 border border-emerald-500/20 shadow-sm transition-transform duration-200 hover:scale-[1.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                <Activity size={12} className="text-emerald-400" />
              </div>
              <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest">Active Fleet</p>
            </div>
            <p className="text-3xl font-extrabold text-emerald-400 tabular-nums">{onlineCount}/3</p>
          </div>
        </div>

        {/* ─── Detailed Status Panels ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2 relative z-10">
          
          {/* Fleet Status List */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-1.5 bg-blue-500/30 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/20">
                <Cpu size={14} className="text-blue-300" />
              </div>
              <h3 className="text-[13px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-cyan-300 uppercase tracking-widest drop-shadow-sm">
                Live Fleet Status
              </h3>
            </div>
            
            <div className="flex flex-col justify-center gap-2 h-[calc(100%-2rem)]">
              {[
                { name: 'raid-robot-01', note: 'Live', isLive: true, Icon: Bot },
                { name: 'esp-002-mock',  note: 'Streaming', isLive: true, Icon: Cpu },
                { name: 'esp-003-mock',  note: 'Streaming', isLive: true, Icon: Cpu },
              ].map(({ name, note, isLive, Icon }) => (
                <div key={name} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] cursor-pointer border border-transparent hover:border-blue-500/30 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-2 w-2">
                      {isLive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isLive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
                    </span>
                    <div className="flex items-center gap-2">
                      <Icon size={14} className="text-blue-300/80 group-hover:text-blue-200 transition-colors" />
                      <span className="text-[14px] text-blue-50 font-bold tracking-wide group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.4)] transition-all">
                        {name}
                      </span>
                    </div>
                  </div>
                  <span className={`text-[12px] font-bold px-2.5 py-1 rounded-md transition-colors ${isLive ? "bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20" : "bg-slate-500/10 text-slate-400"}`}>
                    {note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Load Distribution */}
          <div className="bg-white/5 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-1.5 bg-blue-500/30 rounded-lg shadow-[0_0_15px_rgba(59,130,246,0.3)] border border-blue-400/20">
                <BarChart3 size={14} className="text-blue-300" />
              </div>
              <h3 className="text-[13px] font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-100 to-cyan-300 uppercase tracking-widest drop-shadow-sm">
                Load Distribution
              </h3>
            </div>

            <div className="space-y-3.5">
              {[
                { label: 'Robot-01 (Real)', percent: device1Percent, load: device1Load, barClass: 'progress-bar-amber',  textClass: 'text-amber-400' },
                { label: 'Robot-02 (Mock)', percent: device2Percent, load: device2Load, barClass: 'progress-bar-indigo', textClass: 'text-indigo-400' },
                { label: 'Robot-03 (Mock)', percent: device3Percent, load: device3Load, barClass: 'progress-bar-cyan',   textClass: 'text-cyan-400' },
              ].map(({ label, percent, load, barClass, textClass }) => (
                <div key={label} className="group">
                  <div className="flex justify-between items-center mb-1.5 cursor-default">
                    <span className="text-[13px] text-blue-50 font-bold group-hover:text-white group-hover:drop-shadow-[0_0_5px_rgba(255,255,255,0.3)] transition-all">{label}</span>
                    <span className={`text-[12px] font-bold tabular-nums group-hover:scale-105 transition-transform ${textClass}`}>
                      {percent}% · {load}
                    </span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden shadow-inner">
                    <div
                      className={`${barClass} h-full rounded-full transition-all duration-700 ease-out`}
                      style={{ width: `${Math.max(percent, 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Balance status */}
            <div className={`
              mt-4 px-3 py-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-2
              transition-all duration-200 border
              ${isBalanced
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }
            `}>
              <span className={`inline-flex h-1.5 w-1.5 rounded-full ${isBalanced ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`} />
              {isBalanced ? 'Load Balanced' : 'Imbalanced Load'} · Variance: {loadBalance}%
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT ═══════════ */}
      <div className="px-5 mt-6">
        {/* ─── Fleet Header ─── */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Cpu size={16} className="text-blue-600" />
            </div>
            Active Device Fleet
          </h2>
          <span className="status-badge bg-blue-50 text-blue-700 ring-1 ring-blue-200 text-[11px] font-bold">
            {onlineCount}/3 Online
          </span>
        </div>

        {/* ─── Device Cards Grid ─── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
          <DeviceCard
            deviceId="esp-001" deviceName="Robot-01" isReal={true}
            isConnected={device1.isConnected} liveCracks={device1.liveCracks}
            onViewDetails={() => handleViewDevice("esp-001")}
            onCrackClick={handleCrackClick}
          />
          <DeviceCard
            deviceId="esp-002-mock" deviceName="Robot-02" isReal={false}
            isConnected={device2.isConnected} liveCracks={device2.liveCracks}
            onViewDetails={() => handleViewDevice("esp-002-mock")}
            onCrackClick={handleCrackClick}
          />
          <DeviceCard
            deviceId="esp-003-mock" deviceName="Robot-03" isReal={false}
            isConnected={device3.isConnected} liveCracks={device3.liveCracks}
            onViewDetails={() => handleViewDevice("esp-003-mock")}
            onCrackClick={handleCrackClick}
          />
        </div>

        {/* ─── Heartbeats ─── */}
        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 tracking-tight">
            <div className="p-1.5 bg-emerald-50 rounded-lg">
              <Activity className="text-emerald-600" size={16} />
            </div>
            System Heartbeats
          </h2>
          <div className="bg-white rounded-2xl shadow-md-blue border border-blue-100/40 overflow-hidden">
            <HeartbeatsList heartbeats={allHeartbeats} />
          </div>
        </div>
      </div>

      <CrackDetailModal
        crack={selectedCrack}
        isOpen={showCrackDetail}
        onClose={() => setShowCrackDetail(false)}
        onStatusUpdate={handleCrackStatusUpdate}
      />

      <DeviceCracksModal
        deviceId={selectedDevice}
        deviceName={getSelectedDeviceName()}
        cracks={selectedDeviceCracks}
        isOpen={!!selectedDevice}
        onClose={() => setSelectedDevice(null)}
        onCrackClick={handleCrackClick}
      />

      <BottomNav />
    </div>
  );
}

/* ─────────────────────────────────────────────────
   HeartbeatsList
───────────────────────────────────────────────── */
function HeartbeatsList({ heartbeats }: { heartbeats: any[] }) {
  if (heartbeats.length === 0) {
    return (
      <div className="p-10 text-center text-slate-400 text-[13px] bg-slate-50/50 m-2 rounded-xl border border-dashed border-slate-200">
        <Activity size={32} className="mx-auto mb-2 text-blue-200 animate-pulse" />
        No heartbeats received yet. Waiting for system pings...
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm whitespace-nowrap">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {['Device', 'Sensor', 'Time', 'Status'].map((h) => (
              <th
                key={h}
                className="px-5 py-4 font-bold text-slate-500 text-[10px] uppercase tracking-widest"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 bg-white">
          {heartbeats.slice(0, 8).map((hb, idx) => (
            <tr key={idx} className="hover:bg-blue-50/50 transition-colors group cursor-default">
              <td className="px-5 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100/80 transition-colors">
                    <Cpu size={14} />
                  </div>
                  <span className="font-semibold text-slate-700 text-[13px]">{hb.deviceId || 'Unknown'}</span>
                </div>
              </td>
              <td className="px-5 py-3.5">
                {hb.sensorId ? (
                  <span className={`inline-flex items-center px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                    hb.sensorId === 'LEFT'   ? 'bg-blue-50 text-blue-600'   :
                    hb.sensorId === 'RIGHT'  ? 'bg-indigo-50 text-indigo-600' :
                    hb.sensorId === 'CENTER' ? 'bg-cyan-50 text-cyan-600' :
                    'bg-slate-50 text-slate-600'
                  }`}>
                    {hb.sensorId}
                  </span>
                ) : <span className="text-slate-300 text-[13px]">-</span>}
              </td>
              <td className="px-5 py-3.5 font-medium text-slate-600 text-[13px] tabular-nums">
                {hb.timestamp ? new Date(hb.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'N/A'}
              </td>
              <td className="px-5 py-3.5">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[11px] font-bold tracking-wide">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                  </span>
                  {hb.status === 'NOMINAL_HEARTBEAT' ? 'Nominal' : (hb.status || 'Heartbeat')}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}