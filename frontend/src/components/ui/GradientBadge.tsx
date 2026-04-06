import { ReactNode } from 'react';

interface GradientBadgeProps {
  children: ReactNode;
  icon?: ReactNode;
  variant?: 'primary' | 'success' | 'warning';
}

export default function GradientBadge({ children, icon, variant = 'primary' }: GradientBadgeProps) {
  let borderColors = 'from-accent-primary to-accent-tertiary';
  let textColors = 'text-accent-primary';
  let bgGlow = 'bg-accent-primary/10';

  if (variant === 'success') {
    borderColors = 'from-success flex-success to-emerald-400';
    textColors = 'text-success';
    bgGlow = 'bg-success/10';
  } else if (variant === 'warning') {
    borderColors = 'from-warning to-amber-300';
    textColors = 'text-warning';
    bgGlow = 'bg-warning/10';
  }

  return (
    <div className={`relative inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${bgGlow} overflow-hidden group`}>
      {/* Background Gradient Border Mask */}
      <div className={`absolute inset-0 p-[1px] rounded-full bg-gradient-to-r ${borderColors} [mask-image:linear-gradient(#fff,calc(100%_-_2px)),linear-gradient(#fff,#fff)] [mask-composite:exclude] pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity`} />
      
      {icon && <span className={`w-3.5 h-3.5 ${textColors}`}>{icon}</span>}
      <span className={`text-xs font-bold ${textColors} tracking-wide uppercase`}>
        {children}
      </span>
    </div>
  );
}
