'use client';

import { Suspense, startTransition, useCallback, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Star, MapPin, DollarSign, CheckCircle2, Navigation2, HelpCircle } from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { SkeletonCard } from '@/components/ui/Skeleton';
import { apiJson, ApiError } from '@/lib/api';

type ScoreBreakdown = Record<string, number | string | null>;

interface Worker {
  id: number;
  name: string;
  skills: string[];
  base_price?: number;
  basePrice?: number;
  rating_avg?: number;
  ratingAvg?: number;
  jobs_completed: number;
  lat: number;
  lon: number;
  haversine_distance?: number;
  haversineDistance?: number;
  route_distance?: number;
  routeDistance?: number;
  score: number;
  score_breakdown?: ScoreBreakdown;
  scoreBreakdown?: ScoreBreakdown;
}

const getTierRing = (score: number) => {
  if (score >= 90) return 'from-amber-300 to-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)]';
  if (score >= 75) return 'from-slate-300 to-slate-500 shadow-[0_0_20px_rgba(148,163,184,0.4)]';
  return 'from-accent-primary to-accent-secondary shadow-[0_0_20px_rgba(56,189,248,0.4)]';
};

const getTierBorder = (score: number) => {
  if (score >= 90) return 'border-l-amber-400';
  if (score >= 75) return 'border-l-slate-300';
  return 'border-l-accent-primary';
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<ResultsPageSkeleton />}>
      <ResultsPageContent />
    </Suspense>
  );
}

function ResultsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [requestingId, setRequestingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasSearch = Boolean(searchParams.get('lat') && searchParams.get('lon'));

  const fetchWorkers = useCallback(async () => {
    if (!hasSearch) {
      setWorkers([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      setErrorMessage(null);
      const params = new URLSearchParams(searchParams.toString());
      if (params.has('service_type')) {
        params.set('serviceType', params.get('service_type') || 'Plumbing');
      }
      const data = await apiJson<Worker[] | { content?: Worker[]; workers?: Worker[]; data?: Worker[] }>(
        `/api/workers/search?${params.toString()}`
      );
      const workerList = Array.isArray(data) ? data : (data?.content || data?.workers || data?.data || []);
      setWorkers(Array.isArray(workerList) ? workerList : []);
    } catch (error) {
      setWorkers([]);
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong while loading worker results.'
      );
    } finally {
      setLoading(false);
    }
  }, [hasSearch, searchParams]);

  useEffect(() => {
    void fetchWorkers();
  }, [fetchWorkers]);

  const handleRequestJob = async (worker: Worker) => {
    const serviceType = getDisplayService(searchParams);
    setRequestingId(worker.id);
    try {
      setErrorMessage(null);
      const payload = {
        userId: 1,
        serviceType,
        preferredWorkerId: worker.id,
        userLat: safeNumber(searchParams.get('lat')),
        userLon: safeNumber(searchParams.get('lon')),
        priority: Math.round(safeNumber(searchParams.get('priority'), 3)),
        deadlineMinutes: Math.round(safeNumber(searchParams.get('deadline_hours'), 24) * 60),
        budgetOptional: searchParams.get('budget') ? safeNumber(searchParams.get('budget')) : null
      };

      const data = await apiJson<{ id: number }>('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let targetUrl = `/job/${data.id}`;
      try {
        await apiJson('/api/jobs/allocate', { method: 'POST' });
      } catch {
        targetUrl = `/job/${data.id}?allocation=pending`;
      }

      startTransition(() => {
        router.push(targetUrl);
      });
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'Failed to request job. Please try again.'
      );
    } finally {
      setRequestingId(null);
    }
  };

  if (!hasSearch) {
    return (
      <PageShell className="!pb-20">
        <div className="mx-auto max-w-3xl pt-8">
          <GlassCard className="p-10 text-center">
            <HelpCircle className="mx-auto mb-5 h-14 w-14 text-text-muted" />
            <h2 className="text-3xl font-outfit font-black text-white">Start with a search request</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-text-secondary">
              This page needs location and service parameters before it can rank nearby experts. Jump back to the search screen and launch a new query.
            </p>
            <PremiumButton className="mt-6" onClick={() => router.push('/')}>
              Return to Search
            </PremiumButton>
          </GlassCard>
        </div>
      </PageShell>
    );
  }

  if (loading) {
    return <ResultsPageSkeleton />;
  }

  return (
    <PageShell className="!pt-8 !pb-0 md:!pr-0 max-w-[100vw] overflow-x-hidden">
      <div className="mb-6 grid gap-4 xl:grid-cols-4">
        {[
          { label: 'Service', value: getDisplayService(searchParams) },
          { label: 'Search Radius', value: `${searchParams.get('radiusKm') || '10'} km` },
          { label: 'Deadline', value: `${searchParams.get('deadline_hours') || '24'} hours` },
          { label: 'Location', value: `${safeNumber(searchParams.get('lat')).toFixed(2)}, ${safeNumber(searchParams.get('lon')).toFixed(2)}` }
        ].map((item) => (
          <GlassCard key={item.label} className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-text-muted">{item.label}</p>
            <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
          </GlassCard>
        ))}
      </div>

      <div className="flex h-[calc(100vh-80px)] flex-col gap-6 pr-4 sm:pr-6 lg:pr-8 md:h-[calc(100vh-64px)] md:flex-row">
        <div className="hidden h-full w-[40%] shrink-0 animate-fade-in pb-8 md:sticky md:top-8 md:block" style={{ animationDelay: '100ms' }}>
          <div className="group relative h-full overflow-hidden rounded-[2rem] border border-accent-primary/20 bg-[#050A15] shadow-[0_0_40px_rgba(56,189,248,0.12)]">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPPHBhdGggZD0iTTAgNDBoNDBNNDAgMHY0MCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjEiLz48L3N2Zz4=')] opacity-50" />
            <div className="pointer-events-none absolute inset-0 rounded-[2rem] border-2 border-accent-primary/40 opacity-0 transition-opacity duration-700 group-hover:opacity-100" />

            <div className="absolute left-6 right-6 top-6 flex items-center justify-between">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-bg-primary/80 px-4 py-2 backdrop-blur-md">
                <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
                <span className="text-sm font-semibold tracking-wider text-white">LIVE RADAR</span>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-bg-primary/80 backdrop-blur-md">
                <Navigation2 className="h-5 w-5 text-accent-primary" />
              </div>
            </div>

            <div className="absolute left-6 right-6 bottom-6 rounded-3xl border border-white/10 bg-bg-primary/70 p-5 backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Dispatch Signal</p>
              <p className="mt-2 text-sm font-semibold text-white">Top-ranked experts are mapped here by route efficiency and overall fit score.</p>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="absolute -left-14 -top-14 h-32 w-32 animate-ping rounded-full bg-accent-primary/20" />
                <div className="relative z-10 h-4 w-4 rounded-full border-2 border-white bg-accent-primary shadow-[0_0_18px_rgba(56,189,248,0.9)]" />
              </div>
            </div>

            {workers.slice(0, 4).map((worker, index) => (
              <div
                key={worker.id}
                className="absolute animate-fade-in"
                style={{
                  top: `${22 + (index * 16)}%`,
                  left: `${18 + (index * 16)}%`,
                  animationDelay: `${320 + (index * 160)}ms`
                }}
              >
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-bg-secondary text-xs font-bold shadow-lg shadow-black/50">
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getTierRing(getScoreValue(worker) * 100)}`}>
                    <span className="text-white">{worker.name.charAt(0)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pb-32 md:pb-8 hide-scrollbar scroll-smooth">
          <div className="sticky top-0 z-20 mb-8 flex items-center justify-between border-b border-white/5 bg-[#07111f]/90 py-4 backdrop-blur-xl">
            <div>
              <h2 className="text-3xl font-outfit font-black tracking-tight text-white">Match Intelligence</h2>
              <p className="mt-1 text-sm font-medium text-text-muted">Top <span className="text-accent-primary">{workers.length}</span> professionals ranked for this request.</p>
            </div>
            <button onClick={() => router.push('/')} className="rounded-full bg-white/5 px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-tertiary transition-colors hover:bg-white/10">
              Modify Search
            </button>
          </div>

          {errorMessage && (
            <GlassCard className="mb-6 border border-danger/30 bg-danger/10 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">Backend unavailable</h3>
                  <p className="text-sm text-text-secondary">{errorMessage}</p>
                </div>
                <PremiumButton onClick={() => void fetchWorkers()} className="!py-3 w-full sm:w-auto">
                  Retry
                </PremiumButton>
              </div>
            </GlassCard>
          )}

          {workers.length === 0 ? (
            <GlassCard className="mt-10 p-16 text-center">
              <HelpCircle className="mx-auto mb-4 h-16 w-16 text-text-muted opacity-50" />
              <h3 className="mb-2 text-2xl font-bold text-text-primary">{errorMessage ? 'Results are temporarily unavailable' : 'No professionals found'}</h3>
              <p className="text-text-secondary">
                {errorMessage
                  ? 'Start the backend server and retry the search.'
                  : 'Try expanding the radius or use the seeded San Francisco demo location for richer sample data.'}
              </p>
            </GlassCard>
          ) : (
            <div className="space-y-5">
              {workers.map((worker, index) => {
                const finalScore = getScoreValue(worker) * 100;
                const isTopMatch = index === 0;

                return (
                  <GlassCard
                    key={worker.id}
                    className={`border-l-4 p-5 sm:p-6 transition-all duration-500 animate-fade-up !rounded-2xl ${getTierBorder(finalScore)}`}
                    style={{ animationDelay: `${(index * 120) + 120}ms` }}
                  >
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-5">
                        <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/20 bg-gradient-to-br text-2xl font-extrabold text-white ${getTierRing(finalScore)}`}>
                          {worker.name.charAt(0)}
                        </div>
                        <div>
                          <div className="mb-1 flex items-center gap-3">
                            <h3 className="font-outfit text-xl font-bold tracking-tight text-white">{worker.name}</h3>
                            {isTopMatch && (
                              <span className="flex items-center gap-1 rounded-full border border-success/30 bg-success/20 px-2 py-0.5 text-[10px] font-bold uppercase text-success shadow-[0_0_10px_rgba(52,211,153,0.3)]">
                                <CheckCircle2 className="h-3 w-3" /> Optimum
                              </span>
                            )}
                          </div>
                          <span className="inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold uppercase tracking-wider text-text-muted">
                            {getDisplayService(searchParams)}
                          </span>
                        </div>
                      </div>

                      <div className="w-full shrink-0 sm:w-auto">
                        <PremiumButton
                          onClick={() => {
                            void handleRequestJob(worker);
                          }}
                          disabled={requestingId === worker.id}
                          className="!py-3 w-full sm:w-auto"
                        >
                          {requestingId === worker.id ? 'Connecting...' : 'Secure Booking'}
                        </PremiumButton>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
                      <div className="flex flex-col items-center sm:items-start">
                        <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted"><MapPin className="h-3 w-3" /> Route</span>
                        <div className="font-outfit text-lg font-black text-white">{getRouteDistance(worker).toFixed(1)} <span className="text-sm font-normal text-text-muted">km</span></div>
                      </div>
                      <div className="flex flex-col items-center border-x border-white/5 px-2 sm:items-start">
                        <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted"><Star className="h-3 w-3" /> Rating</span>
                        <div className="flex items-center gap-1 font-outfit text-lg font-black text-white">{getRating(worker).toFixed(1)} <span className="block -translate-y-[1px] text-xs text-warning">★</span></div>
                      </div>
                      <div className="flex flex-col items-center sm:items-end">
                        <span className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-text-muted"><DollarSign className="h-3 w-3" /> Rate</span>
                        <div className="font-outfit text-lg font-black text-white">${getPrice(worker).toFixed(0)}<span className="text-sm font-normal text-text-muted">/hr</span></div>
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Algorithm Breakdown</span>
                        <span className="font-outfit text-sm font-black text-accent-tertiary">
                          {finalScore.toFixed(0)} <span className="text-[10px] font-normal text-text-muted">/ 100</span>
                        </span>
                      </div>

                      <div className="group flex h-2 cursor-crosshair overflow-hidden rounded-full border border-white/10 bg-white/5">
                        {getBreakdownSegments(worker).map((segment) => (
                          <div
                            key={segment.label}
                            style={{ width: `${segment.width}%` }}
                            className={segment.className}
                            title={`${segment.label} contribution`}
                          />
                        ))}
                      </div>
                      <div className="mt-3 grid gap-2 sm:grid-cols-3">
                        {getBreakdownSegments(worker).map((segment) => (
                          <div key={segment.label} className="rounded-2xl border border-white/5 bg-white/[0.03] px-3 py-2">
                            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.22em] text-text-muted">
                              <span>{segment.label}</span>
                              <span>{segment.score.toFixed(0)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </GlassCard>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html:`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </PageShell>
  );
}

function ResultsPageSkeleton() {
  return (
    <PageShell>
      <div className="max-w-5xl mx-auto pt-8">
        <div className="mb-10 flex items-center justify-between">
          <div className="h-6 w-64 animate-pulse rounded bg-white/5" />
        </div>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    </PageShell>
  );
}

function safeNumber(value: number | string | null | undefined, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
}

function getDisplayService(searchParams: URLSearchParams) {
  return searchParams.get('service_type') || searchParams.get('serviceType') || 'Service';
}

function getScoreValue(worker: Worker) {
  return safeNumber(worker.score, 0);
}

function getRouteDistance(worker: Worker) {
  return safeNumber(worker.routeDistance ?? worker.route_distance, 0);
}

function getRating(worker: Worker) {
  return safeNumber(worker.ratingAvg ?? worker.rating_avg, 0);
}

function getPrice(worker: Worker) {
  return safeNumber(worker.basePrice ?? worker.base_price, 0);
}

function getBreakdownSegments(worker: Worker) {
  const breakdown = (worker.scoreBreakdown ?? worker.score_breakdown ?? {}) as ScoreBreakdown;
  const weightedSegments = [
    {
      label: 'Route',
      score: safeNumber(breakdown.distance_norm, 0.4) * 30,
      className: 'bg-gradient-to-r from-accent-primary to-sky-300 transition-opacity hover:opacity-80'
    },
    {
      label: 'Rating',
      score: safeNumber(breakdown.rating_norm, 0.5) * 50,
      className: 'border-l border-[#07111f] bg-gradient-to-r from-accent-secondary to-emerald-300 transition-opacity hover:opacity-80'
    },
    {
      label: 'Price',
      score: safeNumber(breakdown.price_norm, 0.3) * 20,
      className: 'border-l border-[#07111f] bg-gradient-to-r from-accent-tertiary to-amber-300 transition-opacity hover:opacity-80'
    }
  ];

  const total = weightedSegments.reduce((sum, segment) => sum + segment.score, 0) || 1;
  return weightedSegments.map((segment) => ({
    ...segment,
    width: (segment.score / total) * 100
  }));
}
