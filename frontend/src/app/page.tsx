'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, ChevronDown, Calendar, Search, ShieldCheck, Radar, Sparkles } from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { CITY_OPTIONS, DEFAULT_CITY, SERVICE_OPTIONS } from '@/lib/catalog';

const PRIORITIES = [
  { value: '1', label: 'LOW', color: 'bg-white/10 text-text-muted hover:text-white' },
  { value: '2', label: 'MEDIUM', color: 'bg-accent-primary/20 text-accent-primary border-accent-primary/50' },
  { value: '3', label: 'HIGH', color: 'bg-warning/20 text-warning border-warning/50' },
  { value: '4', label: 'CRITICAL', color: 'bg-danger/20 text-danger border-danger/50 shadow-[0_0_15px_rgba(239,68,68,0.3)]' }
];

export default function Home() {
  const router = useRouter();
  const [selectedCity, setSelectedCity] = useState(DEFAULT_CITY.name);
  const [lat, setLat] = useState(DEFAULT_CITY.lat);
  const [lon, setLon] = useState(DEFAULT_CITY.lon);
  const [serviceType, setServiceType] = useState(SERVICE_OPTIONS[0].value);
  const [priority, setPriority] = useState('2');
  const [deadline, setDeadline] = useState('24');
  const [toast, setToast] = useState<{ show: boolean; msg: string }>({ show: false, msg: '' });

  useEffect(() => {
    let timeoutId: number | undefined;

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toFixed(4));
          setLon(position.coords.longitude.toFixed(4));
          setSelectedCity('Current Location');
          setToast({ show: true, msg: 'Current location detected' });
          timeoutId = window.setTimeout(() => setToast({ show: false, msg: '' }), 4000);
        },
        () => console.log('Geolocation denied or unavailable.')
      );
    }

    return () => {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  const handleCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    setSelectedCity(cityName);

    if (cityName !== 'Current Location') {
      const city = CITY_OPTIONS.find((entry) => entry.name === cityName);
      if (city) {
        setLat(city.lat);
        setLon(city.lon);
      }
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/results?lat=${lat}&lon=${lon}&serviceType=${serviceType}&priority=${priority}&deadline_hours=${deadline}`);
  };

  const selectedService = SERVICE_OPTIONS.find((option) => option.value === serviceType) ?? SERVICE_OPTIONS[0];
  const heroStats = [
    { icon: ShieldCheck, label: 'Verified routing', value: 'Resilient fallback states' },
    { icon: Radar, label: 'Live dashboards', value: 'Customer, worker, and admin views' },
    { icon: Sparkles, label: 'Demo-ready flow', value: 'Seeded around San Francisco for instant testing' }
  ];

  return (
    <PageShell className="flex min-h-[90vh] flex-col justify-center">
      <div className={`fixed left-1/2 top-8 z-50 -translate-x-1/2 transition-all duration-500 ${toast.show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0 pointer-events-none'}`}>
        <div className="flex items-center gap-2 rounded-full border border-success/30 bg-success/15 px-4 py-2 text-sm font-medium text-success shadow-[0_4px_20px_rgba(52,211,153,0.16)] backdrop-blur-md">
          {toast.msg}
        </div>
      </div>

      <div className="relative z-10 grid items-start gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-text-secondary animate-fade-up">
            Premium Local Dispatch
          </div>
          <h1 className="mb-6 text-5xl font-outfit font-black leading-tight tracking-tight text-white animate-fade-up md:text-7xl">
            Book the right expert with
            <span className="bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-tertiary bg-clip-text text-transparent animate-[shimmer_3s_linear_infinite] bg-[length:200%_auto]"> live routing intelligence</span>
          </h1>
          <p className="mb-8 max-w-2xl text-lg leading-8 text-text-secondary animate-fade-up" style={{ animationDelay: '120ms' }}>
            Search by service, location, and urgency, then move from discovery to a tracked job flow without hitting broken pages or dead ends.
          </p>

          <div className="grid gap-4 sm:grid-cols-3">
            {heroStats.map((stat, index) => (
              <GlassCard
                key={stat.label}
                hoverEffect
                className="p-5 animate-fade-up"
                style={{ animationDelay: `${180 + (index * 90)}ms` }}
              >
                <stat.icon className="mb-4 h-5 w-5 text-accent-primary" />
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-text-muted">{stat.label}</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white">{stat.value}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        <GlassCard className="animate-fade-up p-6 md:p-8 !rounded-[2rem]" style={{ animationDelay: '260ms' }}>
          <form onSubmit={handleSearch} className="space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-accent-primary">Launch Search</p>
                <p className="mt-2 text-sm text-text-secondary">The demo seed is centered around San Francisco, so that city will give you the richest sample flow.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Selected Service</p>
                <p className="mt-1 text-sm font-semibold text-white">{selectedService.label}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="group relative">
                <select
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-12 text-white transition-all cursor-pointer font-medium focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                >
                  <option value="Current Location" className="bg-[#111827]">Current Location ({lat}, {lon})</option>
                  {CITY_OPTIONS.map((city) => (
                    <option key={city.name} value={city.name} className="bg-[#111827]">{city.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <MapPin className="h-5 w-5 text-accent-primary transition-colors group-focus-within:text-white" />
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <ChevronDown className="h-5 w-5 text-text-muted transition-colors group-focus-within:text-white" />
                </div>
                <span className="pointer-events-none absolute left-12 top-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Location</span>
              </div>

              <div className="group relative">
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full appearance-none rounded-2xl border border-white/10 bg-white/5 py-4 pl-6 pr-12 text-white transition-all cursor-pointer font-medium focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                >
                  {SERVICE_OPTIONS.map((service) => (
                    <option key={service.value} value={service.value} className="bg-[#111827]">
                      {service.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center">
                  <ChevronDown className="h-5 w-5 text-text-muted transition-colors group-focus-within:text-white" />
                </div>
                <span className="pointer-events-none absolute left-6 top-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Service</span>
              </div>

              <div className="relative flex h-[58px] overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-1.5">
                {PRIORITIES.map((item) => {
                  const isActive = priority === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setPriority(item.value)}
                      className={`relative z-10 flex-1 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                        isActive ? `${item.color} border scale-[1.02]` : 'text-text-muted hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
                <span className="absolute left-4 top-2 z-0 hidden text-[10px] font-bold uppercase tracking-wider text-text-muted opacity-30 md:block">Priority</span>
              </div>

              <div className="group relative">
                <div className="pointer-events-none absolute inset-y-0 left-4 flex items-center">
                  <Calendar className="h-5 w-5 text-white/50 transition-colors group-focus-within:text-white" />
                </div>
                <input
                  type="number"
                  min="1"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 pl-12 pr-4 text-white transition-all font-medium placeholder-text-muted focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  placeholder="Deadline in hours"
                  required
                />
                <span className="pointer-events-none absolute right-4 top-2 text-[10px] font-bold uppercase tracking-wider text-text-muted">Deadline</span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-bg-primary/50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-text-muted">Quick context</p>
              <p className="mt-2 text-sm text-text-secondary">
                {selectedService.note}. Search results stay strongest when you use the seeded San Francisco demo or your own local worker data.
              </p>
            </div>

            <PremiumButton type="submit" fullWidth className="py-5 text-lg">
              <div className="flex items-center justify-center gap-2">
                <Search className="h-5 w-5" /> Find the Best Match
              </div>
            </PremiumButton>

            <PremiumButton
              type="button"
              variant="ghost"
              fullWidth
              className="py-4"
              onClick={() => router.push('/worker')}
            >
              Join as a Worker
            </PremiumButton>
          </form>
        </GlassCard>
      </div>

      <div className="mt-8 flex w-full overflow-hidden whitespace-nowrap opacity-70 pointer-events-none">
        <div className="inline-flex animate-[marquee_20s_linear_infinite] gap-4 px-4">
          {SERVICE_OPTIONS.map((service) => (
            <div key={service.value} className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold tracking-wider text-text-secondary">
              {service.label.toUpperCase()}
            </div>
          ))}
        </div>
        <div className="inline-flex animate-[marquee_20s_linear_infinite] gap-4 px-4" aria-hidden="true">
          {SERVICE_OPTIONS.map((service) => (
            <div key={`${service.value}-clone`} className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-sm font-semibold tracking-wider text-text-secondary">
              {service.label.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% { background-position: -200% center; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
      `}} />
    </PageShell>
  );
}
