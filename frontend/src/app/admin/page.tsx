'use client';

import { useCallback, useEffect, useState } from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import { Activity, TimerReset, Users, Server, Database, RefreshCw, ArrowUpDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import PremiumButton from '@/components/ui/PremiumButton';
import GlassCard from '@/components/ui/GlassCard';
import { apiJson, ApiError } from '@/lib/api';

type AdminMetrics = {
  algorithm: string;
  totalWorkers: number;
  availableWorkers: number;
  busyWorkers: number;
  offlineWorkers: number;
  pendingJobs: number;
  assignedJobs: number;
  inProgressJobs: number;
  completedJobs: number;
};

type AllocationRow = {
  id: number | null;
  jobId: number | null;
  workerId: number | null;
  workerName: string;
  serviceType: string;
  status: string;
  etaMinutes: number | null;
  routeDistanceKm: number | null;
  score: number | null;
  assignedAt: string | null;
};

type LoadBand = {
  label: string;
  value: number;
};

type AdminOverview = {
  metrics: AdminMetrics;
  recentAllocations: AllocationRow[];
  loadBands: LoadBand[];
};

type MessageResponse = {
  message?: string;
};

export default function AdminDashboard() {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [actionInFlight, setActionInFlight] = useState<'seed' | 'allocate' | null>(null);

  const fetchOverview = useCallback(async (showSpinner = true) => {
    if (showSpinner) {
      setIsRefreshing(true);
    }

    try {
      setErrorMessage(null);
      const data = await apiJson<AdminOverview>('/api/admin/overview');
      setOverview(data);
    } catch (error) {
      setOverview(null);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to load the admin overview right now.'
      );
    } finally {
      setLoading(false);
      if (showSpinner) {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchOverview(false);
    const interval = setInterval(() => {
      void fetchOverview(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchOverview]);

  const runAction = async (action: 'seed' | 'allocate', endpoint: string, fallbackMessage: string) => {
    try {
      setActionInFlight(action);
      const data = await apiJson<MessageResponse>(endpoint, { method: 'POST' });
      setNotice(data.message ?? fallbackMessage);
      await fetchOverview();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : `Unable to ${action === 'seed' ? 'seed' : 'allocate'} right now.`
      );
    } finally {
      setActionInFlight(null);
    }
  };

  const metrics = overview?.metrics;
  const allocations = overview?.recentAllocations ?? [];
  const loadBands = overview?.loadBands ?? [];
  const readiness = metrics?.totalWorkers
    ? Math.round((metrics.availableWorkers / metrics.totalWorkers) * 100)
    : 0;

  return (
    <PageShell title="System Telemetry">
      <div className="max-w-7xl mx-auto space-y-8 pb-24 md:pb-8">
        <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div>
            <h1 className="flex items-center gap-3 font-outfit text-3xl font-black tracking-tight text-white">
               <Server className="h-8 w-8 text-accent-tertiary" /> Central Node
            </h1>
            <p className="mt-2 text-sm font-medium text-text-secondary">Monitoring routing health, worker readiness, and live allocation activity.</p>
          </div>
          <div className="flex w-full flex-col gap-4 sm:flex-row md:w-auto">
             <PremiumButton
               onClick={() => void runAction('allocate', '/api/jobs/allocate', 'Allocation triggered')}
               disabled={actionInFlight !== null}
               className="!py-3 border-none bg-white text-[#0A0F1E] hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
             >
               <Activity className="mr-2 h-4 w-4" /> {actionInFlight === 'allocate' ? 'Allocating...' : 'Force Batch Allocation'}
             </PremiumButton>
             <PremiumButton
               variant="ghost"
               onClick={() => void runAction('seed', '/api/seed', 'Database seeded')}
               disabled={actionInFlight !== null}
               className="!py-3 border-white/10 hover:bg-white/5"
             >
               <Database className="mr-2 h-4 w-4" /> {actionInFlight === 'seed' ? 'Seeding...' : 'Reset & Seed Data'}
             </PremiumButton>
          </div>
        </div>

        {notice && (
          <GlassCard className="border border-success/30 bg-success/10 p-5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <p className="text-sm text-text-secondary">{notice}</p>
            </div>
          </GlassCard>
        )}

        {errorMessage && (
          <GlassCard className="border border-danger/30 bg-danger/10 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-danger">Backend sync issue</p>
                <p className="mt-2 text-sm text-text-secondary">{errorMessage}</p>
              </div>
            </div>
          </GlassCard>
        )}

        <div className="grid grid-cols-2 gap-4 md:gap-6 lg:grid-cols-4 animate-fade-up" style={{ animationDelay: '200ms' }}>
           <GlassCard className="flex flex-col justify-between border-t-2 border-t-accent-primary p-5">
              <div className="mb-4 flex items-start justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Routing Algorithm</span>
                 <Activity className="h-4 w-4 text-accent-primary" />
              </div>
              <div className="truncate font-outfit text-2xl font-black uppercase tracking-tight text-white">
                 {metrics?.algorithm || 'Greedy EDF'}
              </div>
           </GlassCard>

           <GlassCard className="flex flex-col justify-between border-t-2 border-t-warning p-5">
              <div className="mb-4 flex items-start justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Pending Jobs</span>
                 <TimerReset className="h-4 w-4 text-warning" />
              </div>
              <div className="flex items-end gap-2 font-outfit text-3xl font-black text-white">
                 {metrics?.pendingJobs ?? 0}
                 <span className="mb-1 text-xs font-medium text-warning">queue</span>
              </div>
           </GlassCard>

           <GlassCard className="flex flex-col justify-between border-t-2 border-t-accent-tertiary p-5">
              <div className="mb-4 flex items-start justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Workers Ready</span>
                 <Users className="h-4 w-4 text-accent-tertiary" />
              </div>
              <div className="flex items-end gap-2 font-outfit text-3xl font-black text-white">
                 {metrics?.availableWorkers ?? 0}
                 <span className="mb-1 text-xs font-medium text-text-secondary">available</span>
              </div>
           </GlassCard>

           <GlassCard className="flex flex-col justify-between border-t-2 border-t-success p-5">
              <div className="mb-4 flex items-start justify-between">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Busy Workers</span>
                 <Activity className="h-4 w-4 text-success" />
              </div>
              <div className="font-outfit text-2xl font-black uppercase tracking-wider text-success">
                 {metrics?.busyWorkers ?? 0}
              </div>
           </GlassCard>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
           <div className="space-y-6 lg:col-span-2">
              <GlassCard className="flex h-full flex-col overflow-hidden p-0 animate-fade-in" style={{ animationDelay: '300ms' }}>
                 <div className="flex items-center justify-between border-b border-white/5 bg-[#0A0F1E]/50 p-6">
                    <h3 className="font-outfit text-base font-bold tracking-tight text-white">Recent Allocations Ledger</h3>
                    <button onClick={() => void fetchOverview()} className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-text-muted transition-colors hover:text-white">
                       <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-accent-primary' : ''}`} /> Sync
                    </button>
                 </div>

                 <div className="overflow-x-auto">
                    <table className="w-full border-collapse text-left">
                       <thead>
                          <tr className="border-b border-white/5 bg-[#050A15]/80 text-[10px] uppercase tracking-widest text-text-muted">
                             <th className="max-w-[80px] p-4 font-bold">Assignment</th>
                             <th className="p-4 font-bold">Worker</th>
                             <th className="p-4 font-bold cursor-pointer transition-colors hover:text-white group">
                                <div className="flex items-center gap-1">Route <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></div>
                             </th>
                             <th className="p-4 font-bold cursor-pointer transition-colors hover:text-white group">
                                <div className="flex items-center gap-1">Fit Score <ArrowUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" /></div>
                             </th>
                             <th className="p-4 text-right font-bold">Timestamp</th>
                          </tr>
                       </thead>
                       <tbody className="divide-y divide-white/5 text-sm font-medium text-white">
                          {allocations.map((row) => (
                             <tr key={row.id ?? `${row.jobId}-${row.workerId}`} className="transition-colors hover:bg-white/[0.02]">
                                <td className="p-4"><span className="text-text-muted">#</span>{row.id ?? '--'}</td>
                                <td className="p-4">
                                   <div className="font-semibold text-white">{row.workerName}</div>
                                   <div className="mt-1 text-xs text-text-muted">{row.serviceType} • Job #{row.jobId ?? '--'}</div>
                                </td>
                                <td className="p-4">
                                   <div className="flex items-center gap-3">
                                     <div className="rounded border border-white/5 bg-white/5 px-2 py-1 text-xs">W-{row.workerId ?? '--'}</div>
                                     <div className="h-[1px] w-4 bg-white/10" />
                                     <div className="rounded border border-accent-primary/20 bg-accent-primary/20 px-2 py-1 text-xs text-accent-primary">
                                       {safeNumber(row.routeDistanceKm).toFixed(1)} km
                                     </div>
                                   </div>
                                </td>
                                <td className="p-4">
                                   <div className="flex items-center gap-2">
                                     <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-success/30 text-[10px] font-bold text-success shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                                        {Math.round(safeNumber(row.score) * 100)}
                                     </div>
                                     <div className="hidden h-1 w-16 overflow-hidden rounded-full bg-white/5 sm:block">
                                        <div className="h-full bg-success" style={{ width: `${Math.min(100, Math.round(safeNumber(row.score) * 100))}%` }} />
                                     </div>
                                   </div>
                                </td>
                                <td className="p-4 text-right text-xs text-text-muted">{formatTimestamp(row.assignedAt)}</td>
                             </tr>
                          ))}
                          {!loading && allocations.length === 0 && (
                            <tr>
                              <td className="p-6 text-sm text-text-secondary" colSpan={5}>
                                No allocations have been created yet. Seed demo data or trigger allocation to populate this feed.
                              </td>
                            </tr>
                          )}
                       </tbody>
                    </table>
                 </div>
              </GlassCard>
           </div>

           <div className="space-y-6 lg:col-span-1">
              <GlassCard className="relative flex h-full flex-col items-center justify-center overflow-hidden p-8 animate-fade-in" style={{ animationDelay: '400ms' }}>
                 <div className="pointer-events-none absolute left-1/2 top-1/2 h-48 w-48 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-tertiary/20 blur-[60px]" />

                 <div className="relative z-10 mb-8 w-full text-center">
                    <h3 className="mb-1 text-sm font-bold uppercase tracking-widest text-text-muted">Dispatch Readiness</h3>
                    <p className="text-xs text-text-secondary">Available workers as a share of the current fleet</p>
                 </div>

                 <div className="relative z-10 mb-6 h-48 w-48">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90 transform drop-shadow-[0_0_15px_rgba(56,189,248,0.35)]">
                       <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
                       <circle
                         cx="50"
                         cy="50"
                         r="40"
                         fill="none"
                         stroke="#38bdf8"
                         strokeWidth="12"
                         strokeDasharray={`${(readiness / 100) * 251.2} 251.2`}
                         className="opacity-90 transition-all duration-1000"
                       />
                    </svg>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                       <span className="font-outfit text-3xl font-black leading-none text-white">{readiness}<span className="text-lg text-text-muted">%</span></span>
                       <span className="mt-1 text-[9px] font-bold uppercase tracking-widest text-text-muted">Fleet Ready</span>
                    </div>
                 </div>

                 <div className="relative z-10 w-full space-y-3">
                    {loadBands.map((band) => (
                      <div key={band.label} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">
                          <span>{band.label}</span>
                          <span>{band.value}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className={`h-full ${
                              band.label === 'Ready'
                                ? 'bg-gradient-to-r from-success to-accent-secondary'
                                : band.label === 'Busy'
                                  ? 'bg-gradient-to-r from-warning to-accent-tertiary'
                                  : 'bg-gradient-to-r from-danger to-rose-300'
                            }`}
                            style={{ width: `${getBandWidth(band.value, metrics?.totalWorkers ?? 0)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                 </div>
              </GlassCard>
           </div>
        </div>
      </div>
    </PageShell>
  );
}

function safeNumber(value: number | null | undefined, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function formatTimestamp(value: string | null) {
  if (!value) {
    return '--';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '--';
  }

  return `${formatDistanceToNowStrict(parsed)} ago`;
}

function getBandWidth(value: number, total: number) {
  if (!total) {
    return 0;
  }
  return Math.min(100, Math.round((value / total) * 100));
}
