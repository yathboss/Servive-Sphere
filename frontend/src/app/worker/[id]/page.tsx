'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CheckCircle2, XCircle, PlayCircle, Clock, MapPin, Navigation, Star, Route, Activity, Zap, AlertTriangle } from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { apiJson, ApiError } from '@/lib/api';

type DashboardJob = {
  id: number;
  status: string;
  priority?: number;
  serviceType?: string;
  service_type?: string;
  user_id?: number;
};

type DashboardAssignment = {
  id: number;
  etaMinutes?: number;
  routeDistanceKm?: number;
  job: DashboardJob;
};

type WorkerInfo = {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  bio?: string | null;
  skills?: string[];
  serviceAreas?: string[];
  isAvailable: boolean;
  ratingAvg: number;
  basePrice: number;
  jobsCompleted: number;
  loadCount: number;
};

type DashboardSummary = {
  pendingJobs: number;
  activeJobs: number;
  completedJobs: number;
  currentLoad: number;
  activeDistanceKm: number;
};

type WorkerDashboardResponse = {
  worker: WorkerInfo;
  summary: DashboardSummary;
  assignments: DashboardAssignment[];
};

type MessageResponse = {
  message?: string;
};

export default function WorkerDashboard() {
  const params = useParams();
  const workerId = Array.isArray(params.id) ? params.id[0] : params.id;
  const [dashboard, setDashboard] = useState<WorkerDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setErrorMessage(null);
      const data = await apiJson<WorkerDashboardResponse>(`/api/workers/${workerId}/dashboard`);
      setDashboard(data);
    } catch (error) {
      setDashboard(null);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to load the worker dashboard right now.'
      );
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    void fetchDashboard();
    const interval = setInterval(() => {
      void fetchDashboard();
    }, 20000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  const toggleAvailability = async () => {
    try {
      setBusyAction('availability');
      const nextAvailability = !(dashboard?.worker.isAvailable ?? true);
      await apiJson<MessageResponse>(`/api/workers/${workerId}/availability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: nextAvailability })
      });
      await fetchDashboard();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to update availability.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const updateStatus = async (jobId: number, status: string) => {
    try {
      setBusyAction(`job-${jobId}`);
      await apiJson<MessageResponse>(`/api/jobs/${jobId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      await fetchDashboard();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to update this job right now.'
      );
    } finally {
      setBusyAction(null);
    }
  };

  const declineJob = async (jobId: number) => {
    try {
      setBusyAction(`job-${jobId}`);
      await apiJson<MessageResponse>(`/api/jobs/${jobId}/decline`, { method: 'POST' });
      await fetchDashboard();
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Unable to decline this assignment.'
      );
    } finally {
      setBusyAction(null);
    }
  };

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

  const assignments = dashboard?.assignments ?? [];
  const worker = dashboard?.worker;
  const summary = dashboard?.summary;
  const isAvailable = worker?.isAvailable ?? true;
  const pendingJobs = assignments.filter((assignment) => assignment.job.status === 'assigned');
  const activeJobs = assignments.filter((assignment) => assignment.job.status === 'in_progress');

  return (
    <PageShell title="Command Center">
      <div className="max-w-6xl mx-auto space-y-8 pb-24 md:pb-8">
        {errorMessage && (
          <GlassCard className="border border-danger/30 bg-danger/10 p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-danger" />
                <div>
                  <p className="text-sm font-bold uppercase tracking-[0.25em] text-danger">Workflow issue</p>
                  <p className="mt-2 text-sm text-text-secondary">{errorMessage}</p>
                </div>
              </div>
              <PremiumButton variant="ghost" onClick={() => void fetchDashboard()}>
                Retry Sync
              </PremiumButton>
            </div>
          </GlassCard>
        )}

        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
           <div className="flex items-center gap-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
             <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-br from-accent-primary to-accent-tertiary text-3xl font-extrabold text-[#07111f] shadow-[0_0_30px_rgba(56,189,248,0.3)]">
               {(worker?.name || workerId || 'W').toString().charAt(0)}
             </div>
             <div>
               <h1 className="font-outfit text-3xl font-black tracking-tight text-white">{worker?.name || `Worker #${workerId}`}</h1>
               <div className="mt-2 flex items-center gap-3">
                 <span className="flex items-center text-4xl font-outfit font-black tracking-tighter text-white">
                    <span className="mr-1 text-text-muted">$</span>{safeNumber(worker?.basePrice).toFixed(0)}
                 </span>
                 <span className="rounded-full border border-success/30 bg-success/20 px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-success">
                    Base Rate / Hr
                 </span>
               </div>
             </div>
           </div>

           <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-white/10 bg-[#050A15]/80 p-4 shadow-xl backdrop-blur-xl animate-fade-in" style={{ animationDelay: '200ms' }}>
             <div className="flex flex-col">
               <span className="text-xs font-bold uppercase tracking-widest text-text-muted">Network Status</span>
               <span className={`text-sm font-bold ${isAvailable ? 'text-success' : 'text-danger'}`}>
                 {isAvailable ? 'Receiving Payloads' : 'Offline Mode'}
               </span>
             </div>
             <button
                onClick={toggleAvailability}
                disabled={busyAction === 'availability'}
                className={`relative flex h-10 w-20 cursor-pointer items-center rounded-full border px-1 transition-colors duration-500 ${isAvailable ? 'border-success/50 bg-success/20' : 'border-danger/50 bg-danger/20'}`}
             >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full shadow-lg transition-transform duration-500 ${isAvailable ? 'translate-x-10 bg-success shadow-[0_0_15px_rgba(52,211,153,0.8)]' : 'translate-x-0 bg-danger shadow-[0_0_15px_rgba(248,113,113,0.8)]'}`}>
                  {isAvailable ? <Activity className="h-4 w-4 text-[#050A15]" /> : <XCircle className="h-4 w-4 text-[#050A15]" />}
                </div>
             </button>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-up" style={{ animationDelay: '300ms' }}>
          <GlassCard className="flex items-center justify-between border-l-4 border-l-accent-primary p-6">
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Completed Jobs</span>
              <div className="font-outfit text-3xl font-black leading-none text-white">{summary?.completedJobs ?? 0} <span className="text-sm font-medium text-text-secondary">total</span></div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </GlassCard>

          <GlassCard className="flex items-center justify-between border-l-4 border-l-warning p-6">
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Average Rating</span>
              <div className="flex items-baseline gap-1 font-outfit text-3xl font-black leading-none text-white">
                 {safeNumber(worker?.ratingAvg).toFixed(1)} <span className="block -translate-y-[2px] text-sm font-bold text-warning">★</span>
              </div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-warning/20 bg-warning/10 text-warning">
              <Star className="h-6 w-6" />
            </div>
          </GlassCard>

          <GlassCard className="flex items-center justify-between border-l-4 border-l-accent-tertiary p-6">
            <div>
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-text-muted">Active Route Load</span>
              <div className="font-outfit text-3xl font-black leading-none text-white">{safeNumber(summary?.activeDistanceKm).toFixed(1)} <span className="text-sm font-medium text-text-secondary">km</span></div>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent-tertiary/20 bg-accent-tertiary/10 text-accent-tertiary">
              <Route className="h-6 w-6" />
            </div>
          </GlassCard>
        </div>

        <GlassCard className="animate-fade-up p-6 md:p-8" style={{ animationDelay: '340ms' }}>
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Profile</p>
              <div className="mt-3 space-y-2 text-sm text-text-secondary">
                <p><span className="font-semibold text-white">City:</span> {worker?.city || 'Not set yet'}</p>
                <p><span className="font-semibold text-white">Phone:</span> {worker?.phone || 'Not provided'}</p>
                <p><span className="font-semibold text-white">Email:</span> {worker?.email || 'Not provided'}</p>
              </div>
              <p className="mt-4 text-sm leading-6 text-text-secondary">
                {worker?.bio || 'No worker bio has been added yet. Registering through the new onboarding screen will save a richer profile here.'}
              </p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Skills</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(worker?.skills && worker.skills.length > 0 ? worker.skills : ['General']).map((skill) => (
                    <span key={skill} className="rounded-full border border-accent-primary/20 bg-accent-primary/10 px-4 py-2 text-sm font-semibold text-white">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Service Areas</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {(worker?.serviceAreas && worker.serviceAreas.length > 0 ? worker.serviceAreas : [worker?.city || 'Primary City']).map((area) => (
                    <span key={area} className="rounded-full border border-accent-tertiary/20 bg-accent-tertiary/10 px-4 py-2 text-sm font-semibold text-white">
                      {area}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-7">
             <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '400ms' }}>
               <h3 className="flex items-center gap-2 font-outfit text-xl font-bold tracking-tight text-white">
                 <Zap className="h-5 w-5 fill-warning text-warning" /> Action Needed
               </h3>
               <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{pendingJobs.length} Pending</span>
             </div>

             {pendingJobs.length === 0 ? (
               <GlassCard className="p-12 text-center opacity-60">
                 <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-text-muted" />
                 <p className="font-bold text-text-primary">Queue Empty</p>
                 <p className="text-sm text-text-secondary">Keep availability toggled on to receive payloads.</p>
               </GlassCard>
             ) : (
               <div className="space-y-4">
                 {pendingJobs.map((assignment, index) => (
                   <GlassCard key={assignment.id} className="group animate-fade-up overflow-hidden border-l-4 border-l-warning p-0" style={{ animationDelay: `${500 + (index * 100)}ms` }}>
                      <div className="p-6">
                        <div className="mb-6 flex items-start justify-between">
                           <div className="flex items-center gap-4">
                             <div className="flex h-12 w-12 items-center justify-center rounded-full border border-warning/30 bg-warning/20 text-warning shadow-[0_0_15px_rgba(251,191,36,0.2)]">
                               <Clock className="h-6 w-6" />
                             </div>
                             <div>
                               <h4 className="font-outfit text-lg font-bold text-white">Job #{assignment.job.id} — <span className="capitalize">{assignment.job.serviceType || assignment.job.service_type || 'Service'}</span></h4>
                               <div className="mt-1 flex items-center gap-3 text-sm text-text-secondary">
                                 <span className="flex items-center gap-1"><Navigation className="h-3.5 w-3.5" /> {safeNumber(assignment.routeDistanceKm).toFixed(1)} km</span>
                                 <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {safeNumber(assignment.etaMinutes)} min ETA</span>
                               </div>
                             </div>
                           </div>
                           <div className="rounded border border-white/5 bg-[#050A15] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-accent-primary">
                             Priority: {assignment.job.priority}
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <PremiumButton
                             onClick={() => void updateStatus(assignment.job.id, 'in_progress')}
                             disabled={busyAction === `job-${assignment.job.id}`}
                             className="!bg-gradient-to-r !from-success !to-emerald-600 !py-3 border-none shadow-[0_0_20px_rgba(52,211,153,0.3)] hover:shadow-[0_0_30px_rgba(52,211,153,0.5)]"
                           >
                              <PlayCircle className="mr-2 h-4 w-4" /> {busyAction === `job-${assignment.job.id}` ? 'Updating...' : 'Accept Payload'}
                           </PremiumButton>
                           <PremiumButton
                             variant="ghost"
                             onClick={() => void declineJob(assignment.job.id)}
                             disabled={busyAction === `job-${assignment.job.id}`}
                             className="!py-3 border-danger/30 text-danger hover:border-danger/50 hover:bg-danger/10"
                           >
                              <XCircle className="mr-2 h-4 w-4" /> Decline
                           </PremiumButton>
                        </div>
                      </div>
                   </GlassCard>
                 ))}
               </div>
             )}
          </div>

          <div className="space-y-6 lg:col-span-5">
             <div className="flex items-center justify-between animate-fade-in" style={{ animationDelay: '400ms' }}>
               <h3 className="flex items-center gap-2 font-outfit text-xl font-bold tracking-tight text-white">
                 Active Executions
               </h3>
               <span className="rounded-full border border-accent-primary/30 bg-accent-primary/20 px-3 py-1 text-xs font-bold text-accent-primary">{activeJobs.length} Active</span>
             </div>

             {activeJobs.length === 0 ? (
               <GlassCard className="bg-[#050A15]/40 p-8 text-center opacity-70">
                 <p className="text-sm font-medium text-text-secondary">No active payloads.</p>
               </GlassCard>
             ) : (
               <div className="space-y-4">
                 {activeJobs.map((assignment, index) => (
                   <GlassCard key={assignment.id} className="animate-fade-up border-t-2 border-t-accent-primary bg-gradient-to-b from-accent-primary/10 to-transparent p-5" style={{ animationDelay: `${500 + (index * 100)}ms` }}>
                     <div className="mb-4 flex items-center justify-between">
                       <h4 className="font-outfit font-bold text-white">Task #{assignment.job.id}</h4>
                       <span className="flex items-center gap-1 rounded border border-white/10 bg-bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-success">
                         <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" /> In Progress
                       </span>
                     </div>
                     <p className="mb-6 text-sm capitalize text-text-muted">{assignment.job.serviceType || assignment.job.service_type || 'Service'} — Client {assignment.job.user_id || 'U'}{assignment.job.id}</p>

                     <PremiumButton
                       onClick={() => void updateStatus(assignment.job.id, 'completed')}
                       disabled={busyAction === `job-${assignment.job.id}`}
                       fullWidth
                     >
                       {busyAction === `job-${assignment.job.id}` ? 'Updating...' : 'Mark as Completed'} <CheckCircle2 className="ml-2 h-4 w-4" />
                     </PremiumButton>
                   </GlassCard>
                 ))}
               </div>
             )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

function safeNumber(value: number | undefined, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}
