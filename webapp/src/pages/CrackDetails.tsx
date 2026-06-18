import { useNavigate, useParams } from "react-router-dom";
import MapComponent from "@/components/Map";
import { ArrowLeft, MapPin, Camera, Activity, Clock, Navigation, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAlerts } from "@/context/AlertContext";
import { statusColor } from "@/data/mockData";

const CrackDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alerts } = useAlerts();
  const alert = alerts.find((a) => a.id === Number(id));

  if (!alert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background mesh-bg">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <Activity size={28} className="text-blue-300" />
          </div>
          <p className="text-muted-foreground font-medium">Alert not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-6 mesh-bg">

      {/* ─── Header ─── */}
      <div className="header-gradient text-primary-foreground px-5 pt-14 pb-8 rounded-b-[2rem] relative overflow-hidden animate-slide-in-top">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-glow-cyan -translate-y-16 translate-x-16 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-28 h-28 rounded-full bg-glow-blue translate-y-8 -translate-x-8 pointer-events-none" />

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate(-1)}
            className="bg-white/10 hover:bg-white/20 p-2.5 rounded-xl backdrop-blur-sm border border-white/15 transition-all duration-200 hover:scale-105"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold tracking-tight">Crack Details</h1>
            <p className="text-[11px] text-blue-200/75 mt-0.5">Alert #{alert.id} · {alert.location}</p>
          </div>
          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${statusColor[alert.status].badge}`}>
            {statusColor[alert.status].label}
          </span>
        </div>
      </div>

      <div className="px-5 space-y-4 -mt-4">

        {/* ─── Camera image ─── */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-md border border-border animate-fade-in-up card-hover">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border bg-gradient-to-r from-blue-50/60 to-transparent">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Camera className="text-blue-600" size={14} />
            </div>
            <span className="text-[13px] font-bold text-foreground tracking-tight">Captured Image</span>
            <span className="text-[11px] text-muted-foreground ml-auto font-mono">{alert.timestamp}</span>
          </div>
          <div className="w-full h-52 bg-gradient-to-br from-blue-50 to-indigo-50/50 flex flex-col items-center justify-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-blue-100/80 flex items-center justify-center shadow-sm">
              <Camera className="text-blue-500" size={26} />
            </div>
            <span className="text-[13px] text-muted-foreground font-semibold">Robot Camera Image</span>
            <span className="text-[11px] text-muted-foreground/70">Image will appear here</span>
          </div>
        </div>

        {/* ─── Location ─── */}
        <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border animate-fade-in-up card-hover">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border bg-gradient-to-r from-blue-50/60 to-transparent">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <MapPin className="text-blue-600" size={14} />
            </div>
            <span className="text-[13px] font-bold text-foreground tracking-tight">Location Data</span>
            <button
              onClick={() => navigate(`/map?focus=${alert.id}&lat=${alert.lat}&lng=${alert.lng}`)}
              className="ml-auto flex items-center gap-1.5 text-[12px] text-blue-600 font-semibold hover:text-blue-700 transition-colors link-hover"
            >
              <Navigation size={12} />
              View on Map
            </button>
          </div>

          {/* Mini map */}
          <div className="w-full h-48">
            <MapComponent
              markers={[{ id: String(alert.id), lat: alert.lat, lng: alert.lng }]}
              center={[alert.lng, alert.lat]}
              zoom={16}
            />
          </div>

          {/* Coordinates */}
          <div className="grid grid-cols-2 gap-3 p-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-3.5 border border-blue-100/70">
              <p className="text-[10px] text-blue-600/70 uppercase tracking-widest font-bold mb-1">Track Marker</p>
              <p className="font-extrabold text-blue-900 text-[16px]">KM {alert.km}</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/70">
              <p className="text-[10px] text-emerald-600/70 uppercase tracking-widest font-bold mb-1">GPS Coordinates</p>
              <p className="font-bold text-emerald-900 text-[13px]">{alert.lat.toFixed(4)}° N</p>
              <p className="text-[12px] text-emerald-700/80">{alert.lng.toFixed(4)}° E</p>
            </div>
          </div>
        </div>

        {/* ─── Sensor readings ─── */}
        <div className="bg-card rounded-2xl p-4 shadow-sm border border-border animate-fade-in-up card-hover">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Activity className="text-blue-600" size={14} />
            </div>
            <span className="text-[13px] font-bold text-foreground tracking-tight">Sensor Readings</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-blue-50 to-blue-50/30 rounded-xl p-3.5 border border-blue-100/60">
              <p className="text-[10px] text-blue-600/70 uppercase tracking-widest font-bold mb-2">IR Sensor</p>
              <div className="flex items-center gap-2 mt-1">
                <div className={`w-2 h-2 rounded-full ${alert.irSensor === "Active" ? "bg-success pulse-dot" : "bg-muted-foreground"}`} />
                <span className="text-[13px] font-bold text-foreground">{alert.irSensor}</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-50/30 rounded-xl p-3.5 border border-border/60">
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-2">Detection Time</p>
              <div className="flex items-center gap-1.5 mt-1">
                <Clock size={13} className="text-muted-foreground" />
                <span className="text-[13px] font-bold text-foreground">{alert.timestamp}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Status / Analysis ─── */}
        <div className={`
          bg-card rounded-2xl p-4 shadow-sm border border-border border-l-4 animate-fade-in-up card-hover
          ${alert.status === "pending"   ? "border-l-success"            :
            alert.status === "confirmed" ? "border-l-destructive"        :
            "border-l-muted-foreground"}
        `}>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-3 h-3 rounded-full ${
              alert.status === "pending"   ? "bg-success animate-pulse"  :
              alert.status === "confirmed" ? "bg-destructive"            :
              "bg-muted-foreground"
            }`} />
            <span className={`text-[13px] font-bold ${
              alert.status === "pending"   ? "text-success"              :
              alert.status === "confirmed" ? "text-destructive"          :
              "text-muted-foreground"
            }`}>
              {alert.status === "pending"   ? "Action Pending"    :
               alert.status === "confirmed" ? "Crack Confirmed"   :
               "Alert Ignored"}
            </span>
          </div>
          <p className="text-[12px] text-muted-foreground leading-relaxed">{alert.description}</p>
        </div>

        {/* ─── Action button ─── */}
        {alert.status === "pending" ? (
          <Button
            onClick={() => navigate(`/decision/${alert.id}`)}
            className="w-full h-12 text-[14px] font-bold rounded-xl btn-premium flex items-center justify-center gap-2"
          >
            Take Action
            <ChevronRight size={16} />
          </Button>
        ) : (
          <div className={`
            text-center py-3.5 rounded-2xl border
            ${alert.status === "confirmed"
              ? "bg-destructive/8 border-destructive/20 text-destructive"
              : "bg-muted border-border text-muted-foreground"
            }
          `}>
            <p className="font-bold text-[13px]">
              {alert.status === "confirmed" ? "✓ Crack Confirmed" : "✗ Alert Ignored"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CrackDetails;
