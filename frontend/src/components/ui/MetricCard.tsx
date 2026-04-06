import { ReactNode } from 'react';
import GlassCard from './GlassCard';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon?: ReactNode;
  trend?: { value: number; isPositive: boolean };
}

export default function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <GlassCard hoverEffect={true} className="p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">{title}</h3>
        {icon && <div className="p-2 rounded-lg bg-white/5 text-accent-primary">{icon}</div>}
      </div>
      
      <div className="flex items-end gap-3">
        <span className="text-4xl sm:text-5xl font-extrabold font-outfit text-text-primary tracking-tight">
          {value}
        </span>
        
        {trend && (
          <span className={`flex items-center text-sm font-bold mb-1 ${trend.isPositive ? 'text-success' : 'text-danger'}`}>
            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
        )}
      </div>

      {/* Sparkline Placeholder */}
      <div className="mt-2 h-10 w-full bg-gradient-to-t from-accent-primary/5 to-transparent border-b border-accent-primary/20 rounded-b-lg relative overflow-hidden">
         <div className="absolute bottom-0 left-0 w-full h-[1px] bg-accent-primary/40 shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      </div>
    </GlassCard>
  );
}
