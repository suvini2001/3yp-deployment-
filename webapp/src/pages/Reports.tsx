import { useState, useRef } from "react";
import { FileText, Calendar, TrendingUp, Download, ShieldCheck, Zap, MapPin } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageHeader from "@/components/PageHeader";
import { useTelemetry } from "@/hooks/useTelemetry";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { toast } from "sonner";

const tabs = ["Daily", "Weekly", "Monthly"] as const;

const Reports = () => {
  const [active, setActive] = useState<typeof tabs[number]>("Daily");
  const reportRef = useRef<HTMLDivElement>(null);

  const sensorLeft   = useTelemetry("esp-001", "LEFT");
  const sensorRight  = useTelemetry("esp-001", "RIGHT");
  const sensorCenter = useTelemetry("esp-001", "CENTER");

  const combinedCracks = [
    ...sensorLeft.liveCracks,
    ...sensorRight.liveCracks,
    ...sensorCenter.liveCracks,
  ]
    .filter(c => c.crackDetected !== false && c.status !== 'HEARTBEAT' && c.status !== 'NOMINAL_HEARTBEAT')
    .sort((a, b) => new Date(b.timestamp ?? 0).getTime() - new Date(a.timestamp ?? 0).getTime());

  const isConnected = sensorLeft.isConnected || sensorRight.isConnected || sensorCenter.isConnected;

  const now = new Date();

  const filteredCracks = combinedCracks.filter(crack => {
    if (!crack.timestamp) return false;
    const crackDate = new Date(crack.timestamp);
    const diffTime  = Math.abs(now.getTime() - crackDate.getTime());
    if (active === "Daily")   return diffTime <= 24 * 60 * 60 * 1000;
    if (active === "Weekly")  return diffTime <= 7 * 24 * 60 * 60 * 1000;
    if (active === "Monthly") return diffTime <= 30 * 24 * 60 * 60 * 1000;
    return true;
  });

  const total = filteredCracks.length;

  const getSummaryTitle = () => {
    if (active === "Daily")  return "Today's Summary";
    if (active === "Weekly") return "This Week's Summary";
    return "This Month's Summary";
  };

  const getDateDisplay = () => {
    const today = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    if (active === "Daily") return today;
    const pastDate = new Date();
    if (active === "Weekly")  pastDate.setDate(now.getDate() - 7);
    if (active === "Monthly") pastDate.setDate(now.getDate() - 30);
    return `${pastDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${today}`;
  };

  const downloadPDF = () => {
    toast("Generating PDF report...");
    try {
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const margin = 14;
      const contentW = pageW - margin * 2;
      let y = margin;

      // ── Helper functions ──────────────────────────────────────────
      const checkPageBreak = (needed: number) => {
        if (y + needed > pageH - margin) {
          pdf.addPage();
          y = margin;
        }
      };

      const drawRect = (x: number, yy: number, w: number, h: number, r: number, color: [number, number, number]) => {
        pdf.setFillColor(...color);
        pdf.roundedRect(x, yy, w, h, r, r, 'F');
      };

      // ── Header bar ──────────────────────────────────────────────
      drawRect(0, 0, pageW, 22, 0, [13, 27, 62]);
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(13);
      pdf.setFont("helvetica", "bold");
      pdf.text("RAID · Track Intelligence System", margin, 14);
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(147, 197, 253);
      pdf.text(`Inspection Report  ·  ${getSummaryTitle()}  ·  ${getDateDisplay()}`, margin, 19.5);
      // Right side: status
      const statusLabel = isConnected ? "SYSTEM ONLINE" : "SYSTEM OFFLINE";
      pdf.setTextColor(isConnected ? 52 : 239, isConnected ? 211 : 68, isConnected ? 153 : 68);
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "bold");
      pdf.text(statusLabel, pageW - margin, 14.5, { align: "right" });
      y = 30;

      // ── Summary stats row ──────────────────────────────────────────
      const critical = filteredCracks.filter(c =>
        c.status === 'CRITICAL_DEFECT' || c.status === 'CRACK' || c.severity === 'HIGH'
      ).length;
      const statBoxW = (contentW - 8) / 3;

      const stats = [
        { label: "Total Detections", value: String(total), color: [59, 130, 246] as [number,number,number] },
        { label: "Critical Alerts",  value: String(critical), color: [239, 68, 68] as [number,number,number] },
        { label: "Period", value: active, color: [16, 185, 129] as [number,number,number] },
      ];
      stats.forEach((s, i) => {
        const bx = margin + i * (statBoxW + 4);
        drawRect(bx, y, statBoxW, 20, 2, [240, 245, 255]);
        pdf.setDrawColor(...s.color);
        pdf.setLineWidth(0.6);
        pdf.roundedRect(bx, y, statBoxW, 20, 2, 2, 'S');
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(100, 116, 139);
        pdf.text(s.label.toUpperCase(), bx + 4, y + 7);
        pdf.setFontSize(16);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(...s.color);
        pdf.text(s.value, bx + 4, y + 16);
      });
      y += 26;

      // ── Generated timestamp ──────────────────────────────────────────
      pdf.setFontSize(7.5);
      pdf.setFont("helvetica", "italic");
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Report generated: ${new Date().toLocaleString()}`, margin, y);
      y += 7;

      // ── Divider ──────────────────────────────────────────
      pdf.setDrawColor(203, 213, 225);
      pdf.setLineWidth(0.3);
      pdf.line(margin, y, pageW - margin, y);
      y += 5;

      // ── Section heading ──────────────────────────────────────────
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(30, 41, 59);
      pdf.text("Detection Log", margin, y);
      y += 6;

      // ── Detection entries ──────────────────────────────────────────
      if (filteredCracks.length === 0) {
        checkPageBreak(20);
        drawRect(margin, y, contentW, 18, 3, [240, 253, 244]);
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(16, 185, 129);
        pdf.text("✓  No detections recorded during this period. Track section clear.", margin + 4, y + 11);
        y += 24;
      } else {
        filteredCracks.forEach((crack, idx) => {
          const isCritical = crack.status === 'CRITICAL_DEFECT' || crack.status === 'CRACK' || crack.severity === 'HIGH';
          const rowH = 38;
          checkPageBreak(rowH + 4);

          // Card background
          drawRect(margin, y, contentW, rowH, 3, [248, 250, 252]);
          // Left accent bar
          pdf.setFillColor(...(isCritical ? [239, 68, 68] : [59, 130, 246]) as [number,number,number]);
          pdf.rect(margin, y, 2.5, rowH, 'F');

          // Index badge
          pdf.setFillColor(59, 130, 246);
          pdf.circle(margin + 8, y + 7, 3.5, 'F');
          pdf.setFontSize(6.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(255, 255, 255);
          pdf.text(String(idx + 1), margin + 8, y + 7 + 2.2, { align: "center" });

          // Sensor badge
          const sensorColors: Record<string, [number,number,number]> = {
            LEFT:   [219, 234, 254],
            RIGHT:  [237, 233, 254],
            CENTER: [254, 243, 199],
          };
          const sensorTextColors: Record<string, [number,number,number]> = {
            LEFT:   [37, 99, 235],
            RIGHT:  [109, 40, 217],
            CENTER: [217, 119, 6],
          };
          const sc = sensorColors[crack.sensorId ?? ''] ?? [241, 245, 249];
          const stc = sensorTextColors[crack.sensorId ?? ''] ?? [71, 85, 105];
          drawRect(margin + 14, y + 2.5, 22, 7, 1.5, sc);
          pdf.setFontSize(6.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...stc);
          pdf.text((crack.sensorId ?? 'SENSOR') + ' SENSOR', margin + 25, y + 7.8, { align: "center" });

          // Status badge
          const sc2: [number,number,number] = isCritical ? [254, 226, 226] : [219, 234, 254];
          const tc2: [number,number,number] = isCritical ? [185, 28, 28]   : [29, 78, 216];
          drawRect(margin + 38, y + 2.5, 30, 7, 1.5, sc2);
          pdf.setFontSize(6.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(...tc2);
          pdf.text(crack.status ?? 'DETECTED', margin + 53, y + 7.8, { align: "center" });

          // Timestamp
          pdf.setFontSize(7);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(100, 116, 139);
          const tsText = crack.timestamp ? new Date(crack.timestamp).toLocaleString() : 'N/A';
          pdf.text(tsText, pageW - margin, y + 7.5, { align: "right" });

          // GPS row
          pdf.setFontSize(7.5);
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 41, 59);
          pdf.text("GPS:", margin + 4, y + 18);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(51, 65, 85);
          const lat = crack.latitude  ? Number(crack.latitude).toFixed(6)  : 'N/A';
          const lng = crack.longitude ? Number(crack.longitude).toFixed(6) : 'N/A';
          pdf.text(`Lat ${lat}   Lng ${lng}`, margin + 14, y + 18);

          // Device row
          pdf.setFont("helvetica", "bold");
          pdf.setTextColor(30, 41, 59);
          pdf.text("Device:", margin + 4, y + 25);
          pdf.setFont("helvetica", "normal");
          pdf.setTextColor(51, 65, 85);
          pdf.text(crack.deviceId ?? 'esp-001 (raid-robot-01)', margin + 18, y + 25);

          // Image URL (if present)
          if (crack.imageUrl && crack.imageUrl !== 'No Image (Timeout)') {
            pdf.setFontSize(6.5);
            pdf.setFont("helvetica", "italic");
            pdf.setTextColor(148, 163, 184);
            const shortUrl = crack.imageUrl.length > 70 ? crack.imageUrl.substring(0, 67) + '...' : crack.imageUrl;
            pdf.text(`Image: ${shortUrl}`, margin + 4, y + 33);
          }

          y += rowH + 3;
        });
      }

      // ── Footer on every page ──────────────────────────────────────────
      const totalPages = (pdf as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(203, 213, 225);
        pdf.setLineWidth(0.3);
        pdf.line(margin, pageH - 10, pageW - margin, pageH - 10);
        pdf.setFontSize(7);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(148, 163, 184);
        pdf.text("RAID · Railway Autonomous Inspection Device  |  Confidential", margin, pageH - 6);
        pdf.text(`Page ${i} of ${totalPages}`, pageW - margin, pageH - 6, { align: "right" });
      }

      pdf.save(`RAID-report-${active.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (err) {
      console.error("PDF generation failed:", err);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24 mesh-bg">
      <PageHeader
        title="Reports"
        subtitle="Inspection summaries & analytics"
        icon={<FileText className="text-white" size={22} />}
      />

      <div className="px-5 mt-5 space-y-5" ref={reportRef}>

        {/* ─── Tabs + Download ─── */}
        <div className="flex items-center justify-between gap-3" data-html2canvas-ignore="true">
          <div className="flex gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={`
                  px-5 py-2 rounded-xl text-[13px] font-semibold
                  transition-all duration-250
                  ${active === tab
                    ? "btn-premium"
                    : "bg-card border border-border text-foreground hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 btn-outline-premium"
                  }
                `}
              >
                {tab}
              </button>
            ))}
          </div>
          <Button
            onClick={downloadPDF}
            size="sm"
            className="flex items-center gap-2 whitespace-nowrap btn-premium rounded-xl h-9 px-4"
          >
            <Download size={15} />
            PDF
          </Button>
        </div>

        {/* ─── Combined Hero Banner + Summary ─── */}
        <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl animate-fade-in-up border border-blue-700/20" style={{ animationDelay: '0.1s', minHeight: '240px' }}>
          {/* Background image */}
          <img
            src={`${import.meta.env.BASE_URL}reports-hero.png`}
            alt="Railway inspection monitoring"
            className="absolute inset-0 w-full h-full object-cover object-center scale-105"
          />
          {/* Layered gradient overlays for perfect readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060e24]/90 via-[#0b1121]/70 to-[#060e24]/85" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060e24]/95 via-[#0b1121]/40 to-transparent" />

          {/* Content */}
          <div className="relative z-10 p-6 flex flex-col h-full">

            {/* Top row: label + date + status */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-1 h-4 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
                  <span className="text-[10px] font-bold text-cyan-300/80 uppercase tracking-[0.2em]">RAID · Track Intelligence</span>
                </div>
                <h2 className="text-[22px] font-black text-white tracking-tight drop-shadow-lg">{getSummaryTitle()}</h2>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-70 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                  </span>
                  <span className={`text-[11px] font-bold ${isConnected ? 'text-emerald-300' : 'text-rose-300'}`}>{isConnected ? 'System Live' : 'Offline'}</span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-blue-200/80 tracking-wide">
                  {getDateDisplay()}
                </span>
              </div>
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-auto">
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-bold">Total Detections</p>
                <div className="flex items-end gap-2 mt-2">
                  <p className="text-4xl font-black text-white leading-none">{total}</p>
                  <TrendingUp size={15} className="text-blue-300 mb-1" />
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-bold">Critical Alerts</p>
                <p className="text-4xl font-black text-rose-400 mt-2 leading-none">
                  {filteredCracks.filter(c =>
                    c.status === 'CRITICAL_DEFECT' || c.status === 'CRACK' || c.severity === 'HIGH'
                  ).length}
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors md:col-span-2">
                <p className="text-[10px] text-blue-200/70 uppercase tracking-widest font-bold mb-3">Fleet Connection</p>
                <div className="flex items-center gap-3 bg-black/20 px-3 py-2.5 rounded-lg border border-white/8">
                  <span className="relative flex h-3 w-3">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-200">
                    {isConnected ? "System Online & Actively Monitoring Track" : "All Systems Currently Offline"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Detection Log ─── */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 mb-4 px-1">
            <FileText size={17} className="text-blue-500" />
            <h4 className="font-bold text-[17px] text-foreground tracking-tight">Detection Log</h4>
          </div>

          {filteredCracks.length > 0 ? (
            <div className="space-y-4 stagger-children">
              {filteredCracks.map((crack, idx) => (
                <div
                  key={crack.id || idx}
                  className="bg-card rounded-2xl p-5 border border-border shadow-sm card-hover card-glow"
                >
                  <div className="flex flex-col md:flex-row gap-6">

                    {/* Left: Data */}
                    <div className="flex-1 space-y-5">
                      <div className="flex items-center justify-between border-b border-border pb-4">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className={`
                            inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide
                            ${crack.sensorId === 'LEFT'   ? 'bg-blue-100 text-blue-700'   :
                              crack.sensorId === 'RIGHT'  ? 'bg-purple-100 text-purple-700':
                              crack.sensorId === 'CENTER' ? 'bg-orange-100 text-orange-700':
                              'bg-slate-100 text-slate-600'}
                          `}>
                            {crack.sensorId === 'LEFT'   ? '◀ LEFT SENSOR'   :
                             crack.sensorId === 'RIGHT'  ? '▶ RIGHT SENSOR'  :
                             crack.sensorId === 'CENTER' ? '● CENTER SENSOR' :
                             crack.sensorId || 'SENSOR'}
                          </span>
                          <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5 bg-secondary/60 px-2.5 py-1 rounded-lg">
                            <Calendar size={11} />
                            {new Date(crack.timestamp ?? 0).toLocaleString()}
                          </span>
                        </div>

                        <span className={`
                          px-3 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase
                          ${crack.status === 'CRITICAL_DEFECT' || crack.status === 'CRACK' || crack.severity === 'HIGH'
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                          }
                        `}>
                          {crack.status || 'DETECTED'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-xl p-3.5 border border-blue-100/70">
                          <p className="text-[10px] text-blue-600/70 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                            <MapPin size={11} className="text-blue-500" /> GPS Location
                          </p>
                          <p className="text-[13px] font-bold text-blue-900">Lat: {crack.latitude ? Number(crack.latitude).toFixed(5) : 'N/A'}</p>
                          <p className="text-[13px] font-bold text-blue-900">Lng: {crack.longitude ? Number(crack.longitude).toFixed(5) : 'N/A'}</p>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-50/50 rounded-xl p-3.5 border border-amber-100/70">
                          <p className="text-[10px] text-amber-600/70 font-bold uppercase tracking-widest mb-2 flex items-center gap-1">
                            <Zap size={11} className="text-amber-500" /> System Info
                          </p>
                          <p className="text-[13px] font-bold text-amber-900">
                            Device: <span className="font-mono text-[11px] bg-amber-100/60 px-1.5 py-0.5 rounded">{crack.deviceId ?? 'N/A'}</span>
                          </p>
                          <p className="text-[13px] font-bold text-amber-900">Uptime: {crack.uptime ?? 0}s</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Image */}
                    {crack.imageUrl && crack.imageUrl !== 'No Image (Timeout)' && (
                      <div className="w-full md:w-72 flex-shrink-0 flex flex-col">
                        <div className="relative w-full h-40 bg-black rounded-xl overflow-hidden border-2 border-slate-800 shadow-inner group">
                          <img
                            src={crack.imageUrl}
                            alt="Detection Evidence"
                            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/70 backdrop-blur-md text-white text-[9px] rounded-md font-mono border border-white/20 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                            CAM FEED
                          </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground truncate mt-2 px-1 font-mono text-center">
                          {crack.imageUrl.split('/').pop() || 'evidence_capture.jpg'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-2xl p-12 border border-border flex flex-col items-center justify-center text-center shadow-sm animate-fade-in-up">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <ShieldCheck size={30} />
              </div>
              <h3 className="text-[17px] font-bold text-foreground mb-1 tracking-tight">All Clear</h3>
              <p className="text-[13px] text-muted-foreground max-w-md leading-relaxed">
                No detections were reported during this time period. The track section is clear.
              </p>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default Reports;
