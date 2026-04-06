'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Briefcase, User, LayoutDashboard, Activity, Radar } from 'lucide-react';

interface PageShellProps {
  children: ReactNode;
  title?: string;
  className?: string;
}

export default function PageShell({ children, title, className = '' }: PageShellProps) {
  const pathname = usePathname();
  const currentJobHref = pathname?.startsWith('/job/') ? pathname : '/job/1';
  const currentWorkerHref = pathname?.startsWith('/worker/') ? pathname : '/worker';

  const navItems = [
    { label: 'Search', icon: Search, href: '/' },
    { label: 'My Jobs', icon: Briefcase, href: currentJobHref },
    { label: 'Worker Hub', icon: User, href: currentWorkerHref },
    { label: 'Admin', icon: LayoutDashboard, href: '/admin' }
  ];

  const routeMeta = getRouteMeta(pathname);
  const railTitle = title || routeMeta.label;

  return (
    <div className="relative min-h-screen overflow-x-clip text-text-primary">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(245,158,11,0.14),transparent_32%)]" />

      <aside className="group fixed inset-y-0 left-0 z-50 hidden w-20 overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.04))] backdrop-blur-2xl transition-all duration-300 hover:w-[248px] md:flex md:flex-col">
        <div className="mb-6 flex h-24 items-center px-4 shrink-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-primary via-accent-secondary to-accent-tertiary font-outfit text-lg font-black text-[#06111f] shadow-[0_0_18px_rgba(56,189,248,0.35)]">
            SS
          </div>
          <span className="ml-4 whitespace-nowrap font-outfit text-xl font-bold tracking-tight opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            ServiceSphere
          </span>
        </div>

        <nav className="flex-1 px-3 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href
              || (pathname?.startsWith('/job') && item.href.startsWith('/job/'))
              || (pathname?.startsWith('/worker') && item.href.startsWith('/worker/'));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center rounded-2xl px-4 py-3 transition-all ${
                  isActive
                    ? 'border border-accent-primary/20 bg-accent-primary/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]'
                    : 'border border-transparent text-text-secondary hover:border-white/10 hover:bg-white/5 hover:text-white'
                }`}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="ml-4 whitespace-nowrap text-sm font-medium opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto border-t border-white/5 p-3 shrink-0">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <Radar className="h-5 w-5 text-accent-primary" />
              </div>
              <div className="min-w-0 overflow-hidden opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="truncate text-sm font-bold text-white">Live Routing</div>
                <div className="truncate text-xs text-text-muted">Premium command rail</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <main className={`relative z-10 mx-auto flex w-full flex-1 px-4 pb-32 pt-6 transition-all duration-300 sm:px-6 lg:px-8 md:ml-20 md:pb-16 ${className}`}>
        <div className="max-w-7xl mx-auto w-full">
          <div className="mb-8 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl animate-fade-up">
              <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-accent-primary/90">
                {routeMeta.eyebrow}
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white">
                  {railTitle}
                </span>
                <span className="rounded-full border border-accent-tertiary/20 bg-accent-tertiary/10 px-4 py-2 text-sm font-semibold text-accent-tertiary">
                  Realtime orchestration
                </span>
              </div>
              <p className="mt-4 max-w-xl text-sm leading-6 text-text-secondary">
                {routeMeta.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 animate-fade-in sm:w-auto" style={{ animationDelay: '120ms' }}>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                  <Activity className="h-3.5 w-3.5 text-success" />
                  System
                </div>
                <div className="mt-2 text-sm font-bold text-white">Live UX Pass</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-xl">
                <div className="text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">Routing</div>
                <div className="mt-2 text-sm font-bold text-white">Fail-safe states</div>
              </div>
            </div>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '160ms' }}>
            {children}
          </div>
        </div>
      </main>

      <nav className="fixed inset-x-4 bottom-5 z-50 overflow-hidden rounded-3xl border border-white/10 bg-bg-primary/80 shadow-2xl backdrop-blur-2xl md:hidden">
         <div className="flex items-center justify-between px-2">
           {navItems.map((item) => {
              const isActive = pathname === item.href
                || (pathname?.startsWith('/job') && item.href.startsWith('/job/'))
                || (pathname?.startsWith('/worker') && item.href.startsWith('/worker/'));

              return (
                <Link key={item.href} href={item.href} className="group relative flex flex-1 flex-col items-center justify-center gap-1 py-4">
                  {isActive && (
                    <div className="absolute inset-x-0 top-0 mx-auto h-1 w-8 rounded-b-full bg-gradient-to-r from-accent-primary to-accent-secondary shadow-[0_2px_10px_rgba(56,189,248,0.65)]" />
                  )}
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text-secondary'}`} />
                  <span className={`text-[10px] font-bold ${isActive ? 'text-white' : 'text-text-muted group-hover:text-text-secondary'}`}>
                    {item.label}
                  </span>
                </Link>
              );
           })}
         </div>
      </nav>
    </div>
  );
}

function getRouteMeta(pathname: string | null) {
  if (!pathname || pathname === '/') {
    return {
      eyebrow: 'Customer Dispatch',
      label: 'Find Trusted Experts',
      description: 'Search nearby professionals, compare routing intelligence, and launch a request without leaving the command flow.'
    };
  }

  if (pathname.startsWith('/results')) {
    return {
      eyebrow: 'Match Analysis',
      label: 'Compare Ranked Professionals',
      description: 'Review live recommendations with routing, pricing, and quality signals before you dispatch the best fit.'
    };
  }

  if (pathname.startsWith('/job')) {
    return {
      eyebrow: 'Mission Tracking',
      label: 'Live Job Timeline',
      description: 'Follow the assignment lifecycle in one place, from queueing and matching through completion.'
    };
  }

  if (pathname === '/worker') {
    return {
      eyebrow: 'Worker Onboarding',
      label: 'Join The Network',
      description: 'Create a worker profile, choose your service areas, and move straight into your operating dashboard once approved.'
    };
  }

  if (pathname.startsWith('/worker')) {
    return {
      eyebrow: 'Field Operations',
      label: 'Worker Command Center',
      description: 'Manage availability, accept work quickly, and keep the live queue moving without stale or broken states.'
    };
  }

  if (pathname.startsWith('/admin')) {
    return {
      eyebrow: 'Control Room',
      label: 'Operational Overview',
      description: 'Monitor the queue, worker readiness, and recent allocations with a dashboard wired to the backend.'
    };
  }

  return {
    eyebrow: 'ServiceSphere',
    label: 'Operations Layer',
    description: 'A resilient service dispatch experience with premium motion, live data, and stronger operational visibility.'
  };
}
