import React from "react";
import { X, AlertTriangle, Calendar, Camera, Zap, ShieldCheck } from "lucide-react";
import { CrackEvent } from "@/hooks/useTelemetry";

interface DeviceCracksModalProps {
  deviceId: string | null;
  deviceName: string;
  cracks: CrackEvent[];
  isOpen: boolean;
  onClose: () => void;
  onCrackClick: (crack: CrackEvent) => void;
}

export default function DeviceCracksModal({
  deviceId,
  deviceName,
  cracks,
  isOpen,
  onClose,
  onCrackClick
}: DeviceCracksModalProps) {
  if (!isOpen || !deviceId) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-3xl shadow-xl-blue w-full max-w-3xl max-h-[92vh] overflow-hidden border border-blue-100/60 animate-scale-in flex flex-col">
        {/* HEADER */}
        <div className="flex-shrink-0 header-gradient px-6 py-5 flex items-center justify-between border-b border-white/10 z-10">
          <div>
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              {deviceName} - Detection History
            </h2>
            <p className="text-blue-200/75 text-[12px] mt-0.5 font-medium">
              All historical detections for {deviceId}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {cracks.length > 0 ? (
            cracks.map((crack, idx) => (
              <div
                key={crack.id || idx}
                onClick={() => {
                  onCrackClick(crack);
                }}
                className="bg-background rounded-2xl p-4 border border-border hover:border-blue-300 transition-colors cursor-pointer flex gap-4"
              >
                {crack.imageUrl && crack.imageUrl !== 'No Image (Timeout)' ? (
                  <div className="w-24 h-24 flex-shrink-0 bg-black rounded-lg overflow-hidden relative">
                    <img src={crack.imageUrl} className="w-full h-full object-cover opacity-80" alt="detection" />
                  </div>
                ) : (
                  <div className="w-24 h-24 flex-shrink-0 bg-muted/30 rounded-lg flex items-center justify-center border border-dashed border-border/60">
                    <Camera size={24} className="text-muted-foreground/40" />
                  </div>
                )}
                
                <div className="flex-1 flex flex-col justify-center">
                  <div className="flex justify-between items-start mb-2">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-widest uppercase ${
                      crack.status === 'CRITICAL_DEFECT' || crack.status === 'CRACK' || crack.severity === 'HIGH' || crack.status === 'approved' || crack.status === 'confirmed'
                        ? 'bg-rose-100 text-rose-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}>
                      {crack.status || 'DETECTED'}
                    </span>
                    <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                      <Calendar size={12} />
                      {new Date(crack.timestamp ?? 0).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="text-[12px] text-muted-foreground flex items-center gap-4">
                    <span><strong>Sensor:</strong> {crack.sensorId || 'N/A'}</span>
                    <span><strong>Lat:</strong> {crack.latitude ? Number(crack.latitude).toFixed(4) : 'N/A'}</span>
                    <span><strong>Lng:</strong> {crack.longitude ? Number(crack.longitude).toFixed(4) : 'N/A'}</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card rounded-2xl p-12 border border-border flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4">
                <ShieldCheck size={30} />
              </div>
              <h3 className="text-[17px] font-bold text-foreground mb-1 tracking-tight">All Clear</h3>
              <p className="text-[13px] text-muted-foreground max-w-md">
                No detections have been reported for this device.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
