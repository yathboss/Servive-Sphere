'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Clock, Hourglass, Phone, Star, ShieldCheck, Sparkles, TimerReset } from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { apiJson, ApiError } from '@/lib/api';

type JobRecord = {
  id: number;
  serviceType?: string;
  service_type?: string;
  status: string;
};

type AssignmentReason = {
  base_score?: number;
  final_score?: number;
  load_penalty_applied?: number;
  route_distance?: number;
};

type AssignmentRecord = {
  worker_id?: number;
  workerId?: number;
  worker_name?: string;
  workerName?: string;
  eta_minutes?: number;
  etaMinutes?: number;
  routeDistanceKm?: number | null;
  score?: number | null;
  reasonJson?: AssignmentReason;
  worker?: {
    id?: number;
    name?: string;
  };
};

type JobStatusResponse = {
  job: JobRecord;
  assignment?: AssignmentRecord | Record<string, never>;
};

export default function JobStatusPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<JobStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const jobId = Array.isArray(params.id) ? params.id[0] : params.id;

  const fetchStatus = useCallback(async () => {
    try {
      setErrorMessage(null);
      const result = await apiJson<JobStatusResponse>(`/api/jobs/${jobId}`);
      setData(result);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to load the job status right now.'
      );
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => {
      void fetchStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  if (loading) {
    return (
      <PageShell>
        <div className="flex justify-center items-center h-[50vh]">
          <div className="relative w-24 h-24">
             <div className="absolute inset-0 rounded-full border-t-4 border-accent-primary animate-spin"></div>
             <div className="absolute inset-2 rounded-full border-r-4 border-accent-tertiary animate-[spin_1.5s_linear_infinite_reverse]"></div>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!data) {
    return (
      <PageShell>
        <div className="text-center py-12 text-text-muted">{errorMessage || 'Job record not found.'}</div>
      </PageShell>
    );
  }

  const { job, assignment } = data;
  const workerId = assignment?.workerId ?? assignment?.worker_id ?? assignment?.worker?.id;
  const workerName = assignment?.workerName ?? assignment?.worker_name ?? assignment?.worker?.name;
  const etaMinutes = safeNumber(assignment?.etaMinutes ?? assignment?.eta_minutes, 0);
  const assignmentScore = safeNumber(assignment?.score, 0);
  const routeDistanceKm = safeNumber(assignment?.routeDistanceKm ?? assignment?.reasonJson?.route_distance, 0);
  const normalizedStatus = normalizeStatus(job.status);
  const hasWorker = Boolean(workerId || workerName || assignment?.score);
  const isAssigned = ['assigned', 'in_progress', 'completed'].includes(normalizedStatus) && hasWorker;
  const timelineSteps = ['Submitted', 'Matched', 'Assigned', 'In Progress', 'Completed'];
  const currentStep = getCurrentStep(normalizedStatus);
  const statusMeta = getStatusMeta(normalizedStatus, isAssigned);
  const allocationDeferred = searchParams.get('allocation') === 'pending';
  const reasonCards = getReasonCards(assignmentScore, routeDistanceKm, assignment?.reasonJson);

  return (
    <PageShell title="Mission Control">
      <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8 pb-20 md:pb-8">
        {allocationDeferred && (
          <GlassCard className="border border-warning/30 bg-warning/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.25em] text-warning">Allocation pending</p>
                <p className="mt-2 text-sm text-text-secondary">
                  Your request was created, but live allocation could not be triggered automatically. The job will still appear here once the backend processes it.
                </p>
              </div>
              <PremiumButton variant="ghost" onClick={() => void fetchStatus()}>
                Refresh Status
              </PremiumButton>
            </div>
          </GlassCard>
        )}

        <div className={`w-full rounded-3xl p-6 md:p-8 flex items-center justify-between border shadow-2xl transition-all duration-1000 ${
          statusMeta.tone === 'positive'
            ? 'bg-gradient-to-r from-success/20 to-emerald-900/30 border-success/30 shadow-[0_0_40px_rgba(52,211,153,0.15)]'
            : statusMeta.tone === 'warning'
              ? 'bg-gradient-to-r from-warning/20 to-orange-900/30 border-warning/30 shadow-[0_0_40px_rgba(251,191,36,0.15)]'
              : 'bg-gradient-to-r from-accent-primary/20 to-cyan-900/30 border-accent-primary/30 shadow-[0_0_40px_rgba(56,189,248,0.15)]'
        }`}>
           <div className="flex items-center gap-5">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border ${
                statusMeta.tone === 'positive'
                  ? 'border-success bg-success/20 text-success shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                  : statusMeta.tone === 'warning'
                    ? 'border-warning bg-warning/20 text-warning shadow-[0_0_15px_rgba(251,191,36,0.5)] animate-pulse'
                    : 'border-accent-primary bg-accent-primary/20 text-accent-primary shadow-[0_0_15px_rgba(56,189,248,0.5)]'
              }`}>
                {statusMeta.icon === 'completed' ? <CheckCircle2 className="h-7 w-7" /> : statusMeta.icon === 'active' ? <Sparkles className="h-7 w-7" /> : <Hourglass className="h-7 w-7" />}
              </div>
              <div>
                <h2 className="text-2xl md:text-3xl font-outfit font-black text-white tracking-tight">
                  {statusMeta.title}
                </h2>
                <p className="mt-1 font-medium text-text-secondary">
                  {statusMeta.description(workerId, job.serviceType ?? job.service_type ?? 'your request')}
                </p>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 lg:gap-8">
          <div className="md:col-span-7 space-y-6 lg:space-y-8">
            <GlassCard className="p-8">
               <h3 className="mb-8 text-sm font-bold uppercase tracking-widest text-text-muted">Lifecycle Tracker</h3>
               <div className="relative ml-4 space-y-8 border-l-2 border-white/10">
                 {timelineSteps.map((step, index) => {
                   const active = index <= currentStep;
                   const pulsate = index === currentStep;
                   return (
                     <div key={step} className={`relative pl-8 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-40'}`}>
                        <div className={`absolute -left-[9px] top-1.5 h-4 w-4 rounded-full border-2 bg-bg-primary ${
                          active ? 'border-accent-primary shadow-[0_0_10px_rgba(56,189,248,0.8)]' : 'border-white/20'
                        } ${pulsate ? 'animate-ping before:absolute before:inset-0 before:h-full before:w-full before:rounded-full before:bg-accent-primary before:opacity-50' : ''}`} />
                        <h4 className={`font-outfit text-lg font-bold ${active ? 'text-white' : 'text-text-muted'}`}>{step}</h4>
                        <p className="mt-1 text-sm text-text-secondary">
                          {index === 0 && 'Payload broadcasted to the ServiceSphere network.'}
                          {index === 1 && 'Algorithmic filtering and queue prioritization applied.'}
                          {index === 2 && (isAssigned ? 'Priority dispatch assigned.' : 'Awaiting specialist confirmation...')}
                          {index === 3 && 'Assigned worker is actively on the job.'}
                          {index === 4 && 'Work completed and closed out.'}
                        </p>
                     </div>
                   );
                 })}
               </div>
            </GlassCard>

            {isAssigned && assignment && (
              <GlassCard className="animate-fade-in border-l-4 border-l-success p-6 md:p-8" style={{ animationDelay: '300ms' }}>
                 <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex w-full items-center gap-5">
                       <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-success to-emerald-600 text-2xl font-extrabold text-white shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                         {(workerName || 'W').charAt(0)}
                       </div>
                       <div>
                         <div className="flex items-center gap-2">
                           <h3 className="font-outfit text-2xl font-bold leading-none text-white">{workerName || `Worker #${workerId}`}</h3>
                           <ShieldCheck className="h-5 w-5 text-success" />
                         </div>
                         <div className="mt-2 flex items-center gap-4">
                           <span className="flex items-center gap-1 rounded-full border border-white/5 bg-white/5 px-2 py-0.5 text-sm font-medium text-warning">
                             <Star className="h-3 w-3 fill-warning" /> Assigned
                           </span>
                           <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase text-success">
                             <Clock className="h-3 w-3" /> ETA {etaMinutes > 0 ? etaMinutes : '--'} mins
                           </span>
                         </div>
                       </div>
                    </div>
                    <button className="flex w-full shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-bold text-white transition-colors hover:bg-white/10 sm:w-auto">
                       <Phone className="h-4 w-4" /> Call
                    </button>
                 </div>
              </GlassCard>
            )}
          </div>

          <div className="relative md:col-span-5">
            <div className="sticky top-8 space-y-6">
              {isAssigned && assignment ? (
                <GlassCard className="p-8">
                  <h3 className="mb-6 text-center text-sm font-bold uppercase tracking-widest text-text-muted">Why This Worker?</h3>
                  <div className="space-y-4">
                    {reasonCards.map((card) => (
                      <div key={card.label} className="rounded-2xl border border-white/5 bg-bg-primary/40 p-4">
                        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-[0.24em] text-text-muted">
                          <span>{card.label}</span>
                          <span>{card.value}</span>
                        </div>
                        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                          <div className={card.barClass} style={{ width: `${card.width}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 rounded-2xl border border-white/5 bg-bg-primary/50 p-4">
                    <div className="flex items-center justify-between">
                       <span className="text-xs font-medium text-text-muted">Job #{job.id}</span>
                       <span className="font-outfit text-lg font-black text-white">{(assignmentScore * 100).toFixed(0)}</span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                      Greedy EDF and route-aware ranking selected this worker because their current load, travel distance, and fit score aligned best with your request.
                    </p>
                  </div>
                </GlassCard>
              ) : (
                <GlassCard className="flex min-h-[300px] flex-col items-center justify-center p-8 text-center">
                   <TimerReset className="mb-4 h-12 w-12 animate-spin-slow text-warning opacity-60" />
                   <h3 className="mb-2 font-outfit text-lg font-bold text-white">Calculating Trajectories</h3>
                   <p className="text-sm text-text-secondary">Spatial filtering and load balancing engines are synchronizing your best available match.</p>
                </GlassCard>
              )}

              <PremiumButton variant="ghost" fullWidth onClick={() => router.push('/')} className="!text-danger border-transparent bg-transparent py-4 text-sm transition-all hover:border-danger/20 hover:bg-danger/10">
                 <span className="mr-2 rounded bg-danger/20 px-2 py-0.5 text-[9px] uppercase tracking-widest">{normalizedStatus === 'completed' ? 'Restart' : 'Abort'}</span>
                 {normalizedStatus === 'completed' ? 'Book Another Request' : 'Cancel Payload'}
              </PremiumButton>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function normalizeStatus(status: string | undefined) {
  const normalized = status?.toLowerCase() || 'pending';
  if (['pending', 'assigned', 'in_progress', 'completed'].includes(normalized)) {
    return normalized;
  }
  return 'pending';
}

function getCurrentStep(status: string) {
  switch (status) {
    case 'assigned':
      return 2;
    case 'in_progress':
      return 3;
    case 'completed':
      return 4;
    case 'pending':
    default:
      return 1;
  }
}

function safeNumber(value: number | null | undefined, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function getStatusMeta(status: string, hasAssignment: boolean) {
  if (status === 'completed') {
    return {
      tone: 'positive' as const,
      icon: 'completed' as const,
      title: 'Service Complete',
      description: (_workerId?: number, service = 'your request') => `Your ${service.toLowerCase()} request has been completed successfully.`
    };
  }

  if (status === 'in_progress') {
    return {
      tone: 'neutral' as const,
      icon: 'active' as const,
      title: 'Expert On The Way',
      description: (workerId?: number) => `Worker #${workerId ?? 'Assigned'} is actively working this request.`
    };
  }

  if (status === 'assigned' && hasAssignment) {
    return {
      tone: 'positive' as const,
      icon: 'active' as const,
      title: 'Expert Secured',
      description: (workerId?: number) => `Worker #${workerId ?? 'Assigned'} has accepted the dispatch.`
    };
  }

  return {
    tone: 'warning' as const,
    icon: 'pending' as const,
    title: 'Finding Your Expert',
    description: (_workerId?: number, service = 'your request') => `Analyzing grid payloads for ${service.toLowerCase()}.`
  };
}

function getReasonCards(score: number, routeDistanceKm: number, reasonJson?: AssignmentReason) {
  const finalScore = clamp(score * 100);
  const baseScore = clamp(safeNumber(reasonJson?.base_score, score) * 100);
  const loadPenalty = safeNumber(reasonJson?.load_penalty_applied, 0);

  return [
    {
      label: 'Final Fit Score',
      value: `${finalScore.toFixed(0)} / 100`,
      width: finalScore,
      barClass: 'h-full bg-gradient-to-r from-accent-primary to-accent-secondary'
    },
    {
      label: 'Route Distance',
      value: `${routeDistanceKm.toFixed(1)} km`,
      width: clamp(100 - (routeDistanceKm * 4), 18, 100),
      barClass: 'h-full bg-gradient-to-r from-accent-tertiary to-amber-300'
    },
    {
      label: 'Base Score',
      value: `${baseScore.toFixed(0)} / 100`,
      width: baseScore,
      barClass: 'h-full bg-gradient-to-r from-success to-emerald-300'
    },
    {
      label: 'Load Penalty',
      value: `${loadPenalty.toFixed(0)} active`,
      width: clamp(100 - (loadPenalty * 15), 10, 100),
      barClass: 'h-full bg-gradient-to-r from-white/60 to-white/20'
    }
  ];
}
