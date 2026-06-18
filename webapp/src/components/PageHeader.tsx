import { type ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const PageHeader = ({ title, subtitle, icon, children }: PageHeaderProps) => (
  <div className="header-gradient text-primary-foreground px-5 pt-14 pb-8 rounded-b-[2rem] relative overflow-hidden animate-slide-in-top">
    {/* Decorative orbs */}
    <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-glow-blue -translate-y-16 translate-x-16 pointer-events-none" />
    <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-glow-cyan translate-y-10 -translate-x-10 pointer-events-none" />
    <div className="absolute top-1/2 right-1/4 w-20 h-20 rounded-full bg-white/[0.03] pointer-events-none" />

    <div className="flex items-center justify-between relative z-10">
      <div>
        {subtitle && (
          <p className="text-[12px] text-blue-200/80 font-semibold tracking-widest uppercase mb-1">
            {subtitle}
          </p>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
      </div>
      {icon && (
        <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/15 shadow-lg transition-transform duration-200 hover:scale-105">
          {icon}
        </div>
      )}
    </div>
    {children && <div className="relative z-10 mt-4">{children}</div>}
  </div>
);

export default PageHeader;
