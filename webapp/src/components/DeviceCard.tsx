import React from "react";
import {
  Wifi, MapPin, AlertTriangle, Camera, TrendingUp, Zap
} from "lucide-react";
import { CrackEvent } from "@/hooks/useTelemetry";
import { Button } from "@/components/ui/button";

interface DeviceCardProps {
  deviceId: string;
  deviceName: string;
  isReal: boolean;
  isConnected: boolean;
  liveCracks: CrackEvent[];
  onViewDetails: () => void;
  onCrackClick?: (crack: CrackEvent) => void;
  onCrackStatusUpdate?: (crackId: string | number, newStatus: 'pending' | 'approved' | 'ignored') => void;
}

export default function DeviceCard({
  deviceId,
  deviceName,
  isReal,
  isConnected,
  liveCracks,
  onViewDetails,
  onCrackClick,
  onCrackStatusUpdate,
}: DeviceCardProps) {

  const total        = liveCracks.length;
  const highSeverity = liveCracks.filter(c => c.status === 'approved' || c.status === 'confirmed').length;

  return (
    <div className={`
      rounded-2xl overflow-hidden border card-hover card-glow animate-fade-in-up
      bg-card shadow-md
      ${isReal
        ? 'border-amber-200/80 shadow-amber-100/40'
        : 'border-blue-100/80 shadow-blue-100/30'
      }
    `}>

      {/* ─── HEADER ─── */}
      <div className={`
        px-5 py-4 border-b relative overflow-hidden
        ${isReal
          ? 'bg-gradient-to-br from-amber-50 to-orange-50/50 border-amber-100/70'
          : 'bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border-blue-100/60'
        }
      `}>
        {/* subtle orb */}
        <div className={`
          absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-40
          ${isReal ? 'bg-amber-200/30' : 'bg-blue-200/25'}
        `} />

        <div className="flex items-center justify-between mb-2.5 relative z-10">
          <div>
            <h3 className="text-[15px] font-bold text-foreground leading-tight tracking-tight">
              {deviceName}
            </h3>
            <p className="text-[11px] text-muted-foreground font-mono mt-0.5 tracking-wider">{deviceId}</p>
          </div>

          {/* Source badge */}
          <span className={`
            status-badge font-bold
            ${isReal
              ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-300/60'
              : 'bg-indigo-100 text-indigo-700 ring-1 ring-indigo-300/60'
            }
          `}>
            {isReal ? '🔴 REAL DATA' : '📊 MOCK DATA'}
          </span>
        </div>

        {/* Connection status */}
        <div className="flex items-center gap-2 relative z-10">
          <span className="relative flex h-2 w-2">
            <span className={`
              animate-ping absolute inline-flex h-full w-full rounded-full opacity-60
              ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}
            `} />
            <span className={`
              relative inline-flex rounded-full h-2 w-2
              ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}
            `} />
          </span>
          <p className={`text-[12px] font-semibold ${isConnected ? 'text-emerald-600' : 'text-red-500'}`}>
            {isConnected ? 'Live' : 'Disconnected'}
          </p>
          {isConnected && (
            <span className="text-[10px] text-muted-foreground ml-auto font-medium">● Streaming</span>
          )}
        </div>
      </div>

      {/* ─── STATS GRID ─── */}
      <div className="px-5 pt-4 pb-2">
        <div className="grid grid-cols-2 gap-2.5 mb-4">

          {/* Total Detections */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-3 border border-blue-100/70 group hover:border-blue-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-blue-600/80 font-bold uppercase tracking-wider">Total Cracks</span>
              <div className="p-1 bg-blue-100/80 rounded-lg group-hover:bg-blue-200/60 transition-colors">
                <TrendingUp size={12} className="text-blue-600" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-blue-900 mt-1.5 tabular-nums tracking-tight">{total}</p>
          </div>

          {/* Critical */}
          <div className="bg-gradient-to-br from-rose-50 to-rose-50/50 rounded-xl p-3 border border-rose-100/70 group hover:border-rose-200 transition-colors">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-600/80 font-bold uppercase tracking-wider">Critical</span>
              <div className="p-1 bg-rose-100/80 rounded-lg group-hover:bg-rose-200/60 transition-colors">
                <AlertTriangle size={12} className="text-rose-500" />
              </div>
            </div>
            <p className="text-xl font-extrabold text-rose-600 mt-1.5 tabular-nums tracking-tight">{highSeverity}</p>
          </div>
        </div>
      </div>

      {/* ─── RECENT DETECTIONS ─── */}
      <div className="px-5 py-3 border-t border-border/50">
        <h4 className="text-[10px] font-bold text-muted-foreground mb-3 uppercase tracking-widest flex items-center gap-1.5">
          <Zap size={10} className="text-blue-400" />
          Recent Detections
        </h4>

        {liveCracks.length === 0 ? (
          <div className="text-[12px] text-muted-foreground text-center py-5 bg-muted/30 rounded-xl border border-dashed border-border/60">
            <Camera size={20} className="mx-auto mb-1.5 text-muted-foreground/40" />
            No detections yet
          </div>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto pr-0.5">
            {liveCracks.slice(0, 4).map((crack, idx) => (
              <div
                key={idx}
                onClick={() => onCrackClick?.(crack)}
                className="
                  w-full flex items-center justify-between
                  bg-background hover:bg-blue-50/50
                  rounded-xl px-3 py-2.5 text-[12px]
                  transition-all duration-200 cursor-pointer
                  border border-border/50 hover:border-blue-200/70
                  hover:shadow-sm-blue group
                "
              >
                <div className="text-left">
                  <p className="font-semibold text-foreground leading-tight group-hover:text-blue-700 transition-colors">
                    Detection
                  </p>
                  <p className="text-muted-foreground text-[11px] mt-0.5 tabular-nums">
                    {new Date(crack.timestamp || '').toLocaleTimeString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const key = crack.id?.toString() || crack.timestamp?.toString();
                    if (onCrackStatusUpdate && key) {
                      const isPending = !(crack.status === 'approved' || crack.status === 'confirmed' || crack.status === 'ignored');
                      if (isPending) onCrackStatusUpdate(key, 'approved');
                    }
                  }}
                  className={`
                    status-badge cursor-pointer transition-all hover:scale-105 ml-2
                    ${crack.status === 'approved' || crack.status === 'confirmed'
                      ? 'bg-rose-50 text-rose-600 ring-1 ring-rose-200'
                      : crack.status === 'ignored'
                      ? 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
                      : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                    }
                  `}
                >
                  {crack.status === 'approved' || crack.status === 'confirmed'
                    ? 'confirmed'
                    : crack.status === 'ignored'
                    ? 'ignored'
                    : 'pending'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── ACTION BUTTON ─── */}
      <div className="px-5 py-4 border-t border-border/50 bg-gradient-to-r from-transparent via-blue-50/20 to-transparent">
        <Button
          onClick={onViewDetails}
          className={`
            w-full font-semibold text-[13px] h-10 rounded-xl
            transition-all duration-300
            ${isReal
              ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-sm hover:shadow-md hover:-translate-y-0.5'
              : 'btn-premium'
            }
          `}
        >
          View Details
        </Button>
      </div>
    </div>
  );
}
