import { ReactNode, CSSProperties } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  style?: CSSProperties;
}

export default function GlassCard({ children, className = '', hoverEffect = false, style }: GlassCardProps) {
  return (
    <div 
      className={`relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.04))] shadow-[0_24px_80px_rgba(7,17,31,0.45)] transition-all duration-500 ${hoverEffect ? 'hover:-translate-y-1.5 hover:border-accent-primary/30 hover:shadow-[0_32px_90px_rgba(56,189,248,0.18)]' : ''} ${className}`}
      style={style}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
      {children}
    </div>
  );
}
