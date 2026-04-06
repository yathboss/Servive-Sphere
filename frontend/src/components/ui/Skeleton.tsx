import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 border border-white/10 ${className}`}
      {...props}
    />
  );
}

export function SkeletonProfile() {
  return (
    <div className="flex items-center space-x-4 w-full">
      <Skeleton className="h-16 w-16 rounded-full shrink-0" />
      <div className="space-y-2 w-full">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="pt-2 flex gap-2">
           <Skeleton className="h-6 w-16 rounded-full" />
           <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="p-6 rounded-2xl bg-[#050A15]/50 border border-white/5 shadow-lg w-full">
      <SkeletonProfile />
      <div className="mt-6 space-y-3">
         <Skeleton className="h-3 w-full" />
         <Skeleton className="h-3 w-[90%]" />
         <Skeleton className="h-3 w-[80%]" />
      </div>
      <div className="mt-6 flex justify-between gap-4">
         <Skeleton className="h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
