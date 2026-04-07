import React from 'react';

interface ChartContainerProps {
  title: string;
  badge?: string;
  children: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
}

export default function ChartContainer({
  title,
  badge,
  children,
  emptyState,
  className = '',
}: ChartContainerProps) {
  return (
    <div className={`bg-surface-container-lowest rounded-[2rem] p-7 shadow-sm border border-surface-container-low ${className}`}>
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-base font-bold text-on-surface">{title}</h3>
        {badge && (
          <span className="text-xs text-on-surface-variant font-semibold bg-surface-container-low px-2 py-1 rounded-lg">
            {badge}
          </span>
        )}
      </div>
      {emptyState ? emptyState : children}
    </div>
  );
}
