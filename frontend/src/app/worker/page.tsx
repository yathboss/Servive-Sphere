'use client';

import { type ComponentType, type FormEvent, type ReactNode, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BadgeCheck,
  BriefcaseBusiness,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Sparkles
} from 'lucide-react';
import PageShell from '@/components/ui/PageShell';
import GlassCard from '@/components/ui/GlassCard';
import PremiumButton from '@/components/ui/PremiumButton';
import { apiJson, ApiError } from '@/lib/api';
import { CITY_OPTIONS, DEFAULT_CITY, SERVICE_OPTIONS } from '@/lib/catalog';

type WorkerRegistrationResponse = {
  id: number;
  name: string;
  city?: string;
  skills: string[];
  serviceAreas: string[];
  isAvailable: boolean;
  dashboardUrl: string;
};

export default function WorkerRegistrationPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState(DEFAULT_CITY.name);
  const [basePrice, setBasePrice] = useState('450');
  const [bio, setBio] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [skills, setSkills] = useState<string[]>([]);
  const [serviceAreas, setServiceAreas] = useState<string[]>([DEFAULT_CITY.name]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createdWorker, setCreatedWorker] = useState<WorkerRegistrationResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedCity = CITY_OPTIONS.find((entry) => entry.name === city) ?? DEFAULT_CITY;

  const toggleSkill = (skill: string) => {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((entry) => entry !== skill)
        : [...current, skill]
    );
  };

  const toggleArea = (area: string) => {
    setServiceAreas((current) => {
      if (current.includes(area)) {
        if (current.length === 1) {
          return current;
        }
        return current.filter((entry) => entry !== area);
      }
      return [...current, area];
    });
  };

  const handleCityChange = (nextCity: string) => {
    setCity(nextCity);
    setServiceAreas((current) => (current.includes(nextCity) ? current : [nextCity, ...current]));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (skills.length === 0) {
      setErrorMessage('Choose at least one service specialty before submitting.');
      return;
    }

    if (serviceAreas.length === 0) {
      setErrorMessage('Pick at least one service area from the location list.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage(null);

      const response = await apiJson<WorkerRegistrationResponse>('/api/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email,
          city,
          bio,
          skills,
          serviceAreas,
          basePrice: Number.parseFloat(basePrice) || 0,
          lat: Number.parseFloat(selectedCity.lat),
          lon: Number.parseFloat(selectedCity.lon),
          isAvailable
        })
      });

      setCreatedWorker(response);
    } catch (error) {
      setErrorMessage(
        error instanceof ApiError
          ? error.message
          : 'We could not create this worker profile right now.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdWorker) {
    return (
      <PageShell title="Worker Registered">
        <div className="mx-auto max-w-4xl space-y-6 pb-24 md:pb-8">
          <GlassCard className="overflow-hidden p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(52,211,153,0.18),transparent_32%)]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-success">
                <BadgeCheck className="h-4 w-4" />
                Worker Profile Live
              </div>
              <h1 className="font-outfit text-4xl font-black tracking-tight text-white">
                {createdWorker.name} is now in the network
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-text-secondary">
                The registration is complete. The worker profile is saved with the selected city, specialties, and service coverage areas, and it can move directly into the dashboard.
              </p>
            </div>
          </GlassCard>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <GlassCard className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-primary">Profile Summary</p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <SummaryBlock label="Worker ID" value={`W-${createdWorker.id}`} />
                <SummaryBlock label="Primary City" value={createdWorker.city || city} />
                <SummaryBlock label="Availability" value={createdWorker.isAvailable ? 'Ready for jobs' : 'Saved as offline'} />
                <SummaryBlock label="Skills Added" value={`${createdWorker.skills.length}`} />
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">Specialties</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {createdWorker.skills.map((skill) => (
                    <Chip key={skill} active>
                      {skill}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">Service Areas</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {createdWorker.serviceAreas.map((area) => (
                    <Chip key={area} active>
                      {area}
                    </Chip>
                  ))}
                </div>
              </div>
            </GlassCard>

            <GlassCard className="p-6 md:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-accent-tertiary">Next Step</p>
              <h2 className="mt-3 font-outfit text-2xl font-black text-white">Open the worker dashboard</h2>
              <p className="mt-3 text-sm leading-6 text-text-secondary">
                Jump into the command center to toggle availability, monitor assignments, and manage live dispatches.
              </p>

              <div className="mt-6 space-y-3">
                <PremiumButton fullWidth onClick={() => router.push(createdWorker.dashboardUrl)}>
                  Go To Dashboard
                </PremiumButton>
                <PremiumButton
                  variant="ghost"
                  fullWidth
                  onClick={() => {
                    setCreatedWorker(null);
                    setName('');
                    setPhone('');
                    setEmail('');
                    setCity(DEFAULT_CITY.name);
                    setBasePrice('450');
                    setBio('');
                    setIsAvailable(true);
                    setSkills([]);
                    setServiceAreas([DEFAULT_CITY.name]);
                  }}
                >
                  Register Another Worker
                </PremiumButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell title="Worker Onboarding">
      <div className="mx-auto max-w-6xl space-y-8 pb-24 md:pb-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <GlassCard className="overflow-hidden p-8 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_30%)]" />
            <div className="relative">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent-primary/20 bg-accent-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.28em] text-accent-primary">
                <Sparkles className="h-4 w-4" />
                Join ServiceSphere
              </div>
              <h1 className="font-outfit text-4xl font-black tracking-tight text-white">
                Register a worker profile with the city and service coverage they actually support
              </h1>
              <p className="mt-4 text-sm leading-7 text-text-secondary">
                This onboarding flow asks for the essentials: contact details, specialties, pricing, primary city, and every supported place from the existing location list.
              </p>

              <div className="mt-8 space-y-4">
                <BenefitRow
                  icon={BriefcaseBusiness}
                  label="Specialties"
                  text="Select one or more services so the routing engine can match the worker correctly."
                />
                <BenefitRow
                  icon={MapPin}
                  label="Service Areas"
                  text="Choose any supported city from the location list to show where this worker can operate."
                />
                <BenefitRow
                  icon={BadgeCheck}
                  label="Instant Handoff"
                  text="After registration, the site opens the worker dashboard directly with the new worker ID."
                />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <Field label="Full Name" required>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className={inputClassName}
                    placeholder="Aarav Mehta"
                    required
                  />
                </Field>

                <Field label="Base Rate / Hr" required>
                  <input
                    type="number"
                    min="0"
                    value={basePrice}
                    onChange={(event) => setBasePrice(event.target.value)}
                    className={inputClassName}
                    placeholder="450"
                    required
                  />
                </Field>

                <Field label="Phone">
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className={`${inputClassName} pl-11`}
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </Field>

                <Field label="Email">
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className={`${inputClassName} pl-11`}
                      placeholder="worker@example.com"
                    />
                  </div>
                </Field>
              </div>

              <Field label="Primary City" required>
                <select
                  value={city}
                  onChange={(event) => handleCityChange(event.target.value)}
                  className={inputClassName}
                >
                  {CITY_OPTIONS.map((option) => (
                    <option key={option.name} value={option.name} className="bg-[#0d1728]">
                      {option.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Skills Required For Matching" required>
                <div className="grid gap-3 sm:grid-cols-2">
                  {SERVICE_OPTIONS.map((service) => {
                    const active = skills.includes(service.value);
                    return (
                      <button
                        key={service.value}
                        type="button"
                        onClick={() => toggleSkill(service.value)}
                        className={choiceClassName(active)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-white">{service.label}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.22em] ${active ? 'bg-success/20 text-success' : 'bg-white/5 text-text-muted'}`}>
                            {active ? 'Added' : 'Select'}
                          </span>
                        </div>
                        <p className="mt-2 text-left text-xs leading-5 text-text-secondary">{service.note}</p>
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Service Areas From The Supported Location List" required>
                <div className="flex flex-wrap gap-3">
                  {CITY_OPTIONS.map((option) => {
                    const active = serviceAreas.includes(option.name);
                    return (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => toggleArea(option.name)}
                        className={chipButtonClassName(active)}
                      >
                        {option.name}
                      </button>
                    );
                  })}
                </div>
              </Field>

              <Field label="Short Bio">
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  className={`${inputClassName} min-h-28 resize-y py-4`}
                  placeholder="Tell customers what this worker handles best, certifications, and years of experience."
                />
              </Field>

              <div className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Start as available</p>
                  <p className="mt-1 text-xs leading-5 text-text-secondary">
                    Turn this on if the worker should receive assignments as soon as the profile is created.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAvailable((current) => !current)}
                  className={`relative flex h-10 w-20 items-center rounded-full border px-1 transition-colors ${isAvailable ? 'border-success/40 bg-success/20' : 'border-white/10 bg-white/5'}`}
                >
                  <span
                    className={`h-8 w-8 rounded-full transition-transform ${isAvailable ? 'translate-x-10 bg-success' : 'translate-x-0 bg-white/40'}`}
                  />
                </button>
              </div>

              {errorMessage && (
                <div className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <PremiumButton type="submit" fullWidth disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      Creating Worker
                    </>
                  ) : (
                    'Create Worker Profile'
                  )}
                </PremiumButton>
                <PremiumButton type="button" variant="ghost" fullWidth onClick={() => router.push('/')}>
                  Back To Home
                </PremiumButton>
              </div>
            </form>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  );
}

function Field({
  children,
  label,
  required = false
}: {
  children: ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">
        <span>{label}</span>
        {required && <span className="text-danger">*</span>}
      </div>
      {children}
    </label>
  );
}

function BenefitRow({
  icon: Icon,
  label,
  text
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  text: string;
}) {
  return (
    <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-accent-primary/20 bg-accent-primary/10 text-accent-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="font-semibold text-white">{label}</p>
        <p className="mt-1 text-sm leading-6 text-text-secondary">{text}</p>
      </div>
    </div>
  );
}

function SummaryBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function Chip({
  children,
  active = false
}: {
  children: ReactNode;
  active?: boolean;
}) {
  return (
    <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${active ? 'border-accent-primary/20 bg-accent-primary/10 text-white' : 'border-white/10 bg-white/[0.03] text-text-secondary'}`}>
      {children}
    </span>
  );
}

const inputClassName = 'w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white transition-all placeholder:text-text-muted focus:border-accent-primary/40 focus:bg-white/10 focus:outline-none';

function choiceClassName(active: boolean) {
  return `rounded-3xl border p-4 text-left transition-all ${
    active
      ? 'border-accent-primary/30 bg-accent-primary/10 shadow-[0_0_20px_rgba(56,189,248,0.14)]'
      : 'border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
  }`;
}

function chipButtonClassName(active: boolean) {
  return `rounded-full border px-4 py-2 text-sm font-semibold transition-all ${
    active
      ? 'border-accent-tertiary/30 bg-accent-tertiary/15 text-white shadow-[0_0_14px_rgba(245,158,11,0.16)]'
      : 'border-white/10 bg-white/[0.03] text-text-secondary hover:border-white/20 hover:text-white'
  }`;
}
