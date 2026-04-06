import { ButtonHTMLAttributes, ReactNode } from 'react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'ghost' | 'danger';
  fullWidth?: boolean;
}

export default function PremiumButton({ children, variant = 'primary', fullWidth = false, className = '', ...props }: PremiumButtonProps) {
  const baseStyles = 'relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-2xl font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg-primary active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50';
  const sizeStyles = 'px-6 py-3 text-sm';
  const widthStyles = fullWidth ? 'w-full' : '';

  let variantStyles = '';
  if (variant === 'primary') {
    variantStyles = 'border border-white/10 bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary text-[#06111f] shadow-[0_18px_45px_rgba(56,189,248,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_55px_rgba(45,212,191,0.32)] focus:ring-accent-primary';
  } else if (variant === 'ghost') {
    variantStyles = 'border border-white/10 bg-white/5 text-text-primary backdrop-blur-md hover:border-accent-primary/40 hover:bg-white/10 focus:ring-white/20';
  } else if (variant === 'danger') {
    variantStyles = 'bg-danger/10 border border-danger/30 text-danger hover:bg-danger/20 hover:border-danger/50 focus:ring-danger/50';
  }

  return (
    <button className={`${baseStyles} ${sizeStyles} ${widthStyles} ${variantStyles} ${className}`} {...props}>
      {variant === 'primary' && (
        <span className="absolute inset-0 z-0 bg-[linear-gradient(115deg,transparent,rgba(255,255,255,0.55),transparent)] bg-[length:220%_100%] animate-shimmer opacity-0 transition-opacity hover:opacity-100" />
      )}
      <span className="relative z-10 flex items-center gap-2">{children}</span>
    </button>
  );
}
