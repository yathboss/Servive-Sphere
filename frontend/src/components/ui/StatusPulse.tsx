interface StatusPulseProps {
  status: 'online' | 'offline' | 'busy' | 'success' | 'warning' | 'danger';
}

export default function StatusPulse({ status }: StatusPulseProps) {
  let colorClass = 'bg-text-muted';
  let glowClass = 'bg-text-muted/30';

  switch (status) {
    case 'online':
    case 'success':
      colorClass = 'bg-success';
      glowClass = 'bg-success/40';
      break;
    case 'warning':
    case 'busy':
      colorClass = 'bg-warning';
      glowClass = 'bg-warning/40';
      break;
    case 'danger':
    case 'offline':
      colorClass = 'bg-danger';
      glowClass = 'bg-danger/40';
      break;
  }

  return (
    <div className="relative flex items-center justify-center w-3 h-3">
      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${glowClass}`}></span>
      <span className={`relative inline-flex rounded-full w-2 h-2 ${colorClass}`}></span>
    </div>
  );
}
