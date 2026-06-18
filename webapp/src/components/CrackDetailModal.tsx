import React, { useState } from "react";
import { X, MapPin, Clock, CheckCircle, XCircle, Map, Camera, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CrackEvent } from "@/hooks/useTelemetry";
import { useNavigate } from "react-router-dom";
import MapComponent from "@/components/Map";

interface CrackDetailModalProps {
  crack: CrackEvent | null;
  isOpen: boolean;
  onClose: () => void;
  onStatusUpdate: (crackId: string | number, status: 'pending' | 'approved' | 'ignored') => void;
}

export default function CrackDetailModal({
  crack, isOpen, onClose, onStatusUpdate
}: CrackDetailModalProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const navigate = useNavigate();

  if (!isOpen || !crack) return null;

  const locationLabel = (() => {
    const location = crack.location;
    if (typeof location === "string" && location.trim().length > 0) return location;
    if (location && typeof location === "object") {
      const lat = Number((location as any).lat);
      const lng = Number((location as any).lng);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        return `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`;
      }
    }
    return "Railway Track Section";
  })();

  const resolvedImageUrl =
    crack.imageUrl      ||
    crack.image_url     ||
    crack.media?.imageUrl ||
    crack.media?.image_url ||
    crack.media?.s3Url  ||
    crack.media?.s3_url ||
    crack.media?.url;

  const handleApprove = async () => {
    setIsUpdating(true);
    const key = crack.id?.toString() || crack.timestamp?.toString() || '';
    onStatusUpdate(key, 'approved');
    setTimeout(() => { setIsUpdating(false); onClose(); }, 500);
  };

  const handleIgnore = async () => {
    setIsUpdating(true);
    const key = crack.id?.toString() || crack.timestamp?.toString() || '';
    onStatusUpdate(key, 'ignored');
    setTimeout(() => { setIsUpdating(false); onClose(); }, 500);
  };

  const openMapInInternalApp = () => {
    const lat = crack.gps?.lat || 7.8731;
    const lng = crack.gps?.lng || 80.7718;
    navigate(`/map?lat=${lat}&lng=${lng}&focus=${crack.id}`);
    onClose();
  };

  // Status color mapping
  const statusConfig = {
    confirmed:  { badge: 'bg-rose-100 text-rose-700 border border-rose-200',  label: 'CONFIRMED' },
    approved:   { badge: 'bg-rose-100 text-rose-700 border border-rose-200',  label: 'CONFIRMED' },
    ignored:    { badge: 'bg-slate-100 text-slate-600 border border-slate-200', label: 'IGNORED' },
    pending:    { badge: 'bg-blue-100 text-blue-700 border border-blue-200',   label: 'PENDING' },
  };
  const crackStatus = (crack.status === 'approved' || crack.status === 'confirmed')
    ? 'approved'
    : crack.status === 'ignored'
    ? 'ignored'
    : 'pending';
  const cfg = statusConfig[crackStatus as keyof typeof statusConfig] || statusConfig.pending;

  return (
    <div className="fixed inset-0 bg-navy-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card rounded-3xl shadow-xl-blue w-full max-w-4xl max-h-[92vh] overflow-y-auto border border-blue-100/60 animate-scale-in">

        {/* ─── HEADER ─── */}
        <div className="sticky top-0 header-gradient px-6 py-5 flex items-center justify-between border-b border-white/10 rounded-t-3xl z-10">
          <div className="flex-1 relative z-10">
            <h2 className="text-xl font-extrabold text-white tracking-tight">Crack Details</h2>
            <p className="text-blue-200/75 text-[12px] mt-0.5 font-medium">
              Alert #{crack.id} · {locationLabel}
            </p>
          </div>
          <div className="flex items-center gap-3 relative z-10">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${cfg.badge}`}>
              {cfg.label}
            </span>
            <button
              onClick={onClose}
              className="text-blue-200 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all duration-200 hover:scale-105"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* ─── CONTENT ─── */}
        <div className="p-6 space-y-5">

          {/* Image section */}
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Camera size={14} className="text-blue-600" />
              </div>
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Captured Image</h3>
              {crack.timestamp && (
                <span className="text-[11px] text-muted-foreground ml-auto font-mono tabular-nums">
                  {new Date(crack.timestamp).toLocaleString()}
                </span>
              )}
            </div>
            <div className="w-full bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-2xl border border-blue-100/70 overflow-hidden aspect-video flex items-center justify-center">
              {resolvedImageUrl ? (
                <img
                  src={resolvedImageUrl}
                  alt="Track Defect"
                  className="w-auto h-auto max-w-full max-h-full object-contain"
                  onError={(e) => {
                    console.error("Image failed to load:", resolvedImageUrl);
                    (e.target as HTMLImageElement).src = '';
                  }}
                />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100/80 flex items-center justify-center mx-auto mb-3">
                    <Camera size={28} className="text-blue-400" />
                  </div>
                  <p className="text-muted-foreground font-semibold text-[14px]">Robot Camera Image</p>
                  <p className="text-muted-foreground/60 text-[12px] mt-0.5">Image will appear here</p>
                </div>
              )}
            </div>
          </div>

          {/* Location section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <MapPin size={14} className="text-blue-600" />
                </div>
                <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Location Data</h3>
              </div>
              <button
                onClick={openMapInInternalApp}
                className="flex items-center gap-1.5 text-[12px] font-bold text-blue-600 hover:text-blue-700 transition-colors link-hover"
              >
                <Map size={14} />
                View on Map
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {/* Track marker */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-4 border border-blue-100/70">
                <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest mb-2">Track Marker</p>
                <p className="text-3xl font-extrabold text-blue-900 tracking-tight">KM {crack.km?.toFixed(1)}</p>
              </div>
              {/* GPS */}
              <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-4 border border-emerald-100/70">
                <p className="text-[10px] text-emerald-600/70 font-bold uppercase tracking-widest mb-2">GPS Coordinates</p>
                <p className="text-[13px] font-bold text-emerald-900">{crack.gps?.lat?.toFixed(4)}° N</p>
                <p className="text-[13px] font-bold text-emerald-900">{crack.gps?.lng?.toFixed(4)}° E</p>
              </div>
            </div>
            {/* Mini map */}
            {crack.gps?.lat && crack.gps?.lng && (
              <div className="w-full h-48 rounded-2xl overflow-hidden border border-border mt-4 shadow-sm">
                <MapComponent
                  markers={[{
                    id: String(crack.id),
                    lat: crack.gps.lat,
                    lng: crack.gps.lng,
                    severity: crack.severity ?? 0.5,
                  }]}
                  center={[crack.gps.lng, crack.gps.lat]}
                  zoom={16}
                />
              </div>
            )}
          </div>

          {/* Sensor readings */}
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-4 border border-border">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Zap size={14} className="text-blue-600" />
              </div>
              <h3 className="text-[13px] font-bold text-foreground uppercase tracking-wide">Sensor Readings</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">Detection Type</p>
                <p className="text-[13px] font-semibold text-foreground">{crack.type || 'IR Detection'}</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mb-1.5">Detection Time</p>
                <p className="text-[13px] font-semibold text-foreground">
                  {crack.timestamp ? new Date(crack.timestamp).toLocaleTimeString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          {/* Analysis */}
          {crack.description && (
            <div className={`
              rounded-2xl p-4 border-l-4
              ${crackStatus === 'approved'
                ? 'bg-emerald-50 border-emerald-400'
                : crackStatus === 'ignored'
                ? 'bg-slate-50 border-slate-300'
                : 'bg-blue-50 border-blue-400'
              }
            `}>
              <h3 className="text-[12px] font-bold text-foreground uppercase tracking-wider mb-2">Analysis Details</h3>
              <p className="text-[13px] text-muted-foreground leading-relaxed">{crack.description}</p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4 border-t border-border">
            <Button
              onClick={handleApprove}
              disabled={isUpdating || crackStatus === 'approved'}
              className={`
                flex-1 font-bold py-3 h-12 flex items-center justify-center gap-2 text-[14px] rounded-xl
                transition-all duration-300
                ${crackStatus === 'approved'
                  ? 'bg-rose-100 text-rose-700 cursor-not-allowed border border-rose-200'
                  : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                }
              `}
            >
              <CheckCircle size={18} />
              {crackStatus === 'approved' ? 'Confirmed' : 'Confirm'}
            </Button>
            <Button
              onClick={handleIgnore}
              disabled={isUpdating || crackStatus === 'ignored'}
              className={`
                flex-1 font-bold py-3 h-12 flex items-center justify-center gap-2 text-[14px] rounded-xl
                transition-all duration-300
                ${crackStatus === 'ignored'
                  ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5'
                }
              `}
            >
              <XCircle size={18} />
              {crackStatus === 'ignored' ? 'Ignored' : 'Ignore'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
