import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, MapPin, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAlerts } from "@/context/AlertContext";

const Decision = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { alerts, updateStatus } = useAlerts();
  const alert = alerts.find((a) => a.id === Number(id));
  const [decided, setDecided] = useState(false);
  const [decision, setDecision] = useState<"confirmed" | "ignored" | null>(null);

  if (!alert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background mesh-bg">
        <div className="text-center animate-fade-in-up">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={26} className="text-blue-300" />
          </div>
          <p className="text-muted-foreground font-medium">Alert not found</p>
        </div>
      </div>
    );
  }

  const handleConfirm = () => {
    updateStatus(alert.id, "confirmed");
    setDecision("confirmed");
    setDecided(true);
    toast.success("Crack confirmed — maintenance team notified");
    setTimeout(() => navigate("/alerts"), 1800);
  };

  const handleIgnore = () => {
    updateStatus(alert.id, "ignored");
    setDecision("ignored");
    setDecided(true);
    toast("Alert marked as ignored");
    setTimeout(() => navigate("/alerts"), 1800);
  };

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
          <div>
            <h1 className="text-xl font-bold tracking-tight">Decision Required</h1>
            <p className="text-[11px] text-blue-200/75 mt-0.5 font-medium">Alert #{alert.id}</p>
          </div>
        </div>
      </div>

      <div className="px-5 -mt-4 space-y-4">

        {/* ─── Alert summary ─── */}
        <div className="bg-card rounded-2xl p-5 shadow-md border border-border animate-fade-in-up card-hover">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-xl">
              <AlertTriangle className="text-rose-500" size={22} />
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground text-[17px] tracking-tight">{alert.type}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-[12px] text-amber-600 font-semibold">Action Pending</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-[13px] text-foreground">
              <MapPin className="text-blue-500" size={14} />
              <span className="font-medium">{alert.location}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
              <Clock size={14} />
              <span>{alert.time}</span>
            </div>
          </div>

          <p className="text-[13px] text-muted-foreground leading-relaxed border-t border-border pt-3.5">
            {alert.description}
          </p>
        </div>

        {/* ─── Human-in-the-loop notice ─── */}
        <div className="bg-blue-50 border border-blue-200/70 rounded-2xl p-3.5 flex items-center gap-3 animate-fade-in-up">
          <ShieldAlert size={18} className="text-blue-500 flex-shrink-0" />
          <p className="text-[12px] text-blue-700 font-semibold leading-snug">
            Human-in-the-loop verification required before proceeding
          </p>
        </div>

        {/* ─── Action buttons or result ─── */}
        {!decided ? (
          <div className="space-y-3 pt-2 stagger-children animate-fade-in-up">
            <Button
              onClick={handleConfirm}
              className="
                w-full h-14 text-[15px] font-bold gap-3 rounded-2xl
                bg-gradient-to-r from-emerald-500 to-emerald-600
                hover:from-emerald-600 hover:to-emerald-700
                text-white shadow-lg shadow-emerald-500/20
                transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-emerald-500/25
              "
            >
              <CheckCircle2 size={22} />
              Confirm Crack
            </Button>
            <Button
              onClick={handleIgnore}
              variant="outline"
              className="
                w-full h-14 text-[15px] font-bold gap-3 rounded-2xl
                border-2 border-border text-muted-foreground
                hover:bg-slate-50 hover:border-slate-300 hover:text-foreground
                transition-all duration-300 hover:-translate-y-0.5
              "
            >
              <XCircle size={22} />
              Ignore Alert
            </Button>
          </div>
        ) : (
          <div className="text-center py-12 animate-scale-in">
            <div className={`
              w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg
              ${decision === "confirmed"
                ? "bg-gradient-to-br from-emerald-100 to-emerald-50 shadow-emerald-200/60"
                : "bg-gradient-to-br from-slate-100 to-slate-50 shadow-slate-200/60"
              }
            `}>
              {decision === "confirmed" ? (
                <CheckCircle2 className="text-emerald-500" size={44} />
              ) : (
                <XCircle className="text-slate-400" size={44} />
              )}
            </div>
            <p className="font-extrabold text-[18px] text-foreground tracking-tight">
              {decision === "confirmed" ? "Crack Confirmed" : "Alert Ignored"}
            </p>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              {decision === "confirmed"
                ? "Maintenance team has been notified"
                : "Alert has been archived"}
            </p>
            <p className="text-[11px] text-muted-foreground/60 mt-3 font-medium">Redirecting...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Decision;
