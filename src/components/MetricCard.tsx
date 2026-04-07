import React from 'react';
import { motion } from 'motion/react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ElementType;
  iconColor?: string;
  iconBg?: string;
  variant?: 'default' | 'primary' | 'gradient';
  badge?: string;
  className?: string;
  animate?: boolean;
}

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-primary',
  iconBg = 'bg-primary/10',
  variant = 'default',
  badge,
  className = '',
  animate = true,
}: MetricCardProps) {
  const variants = {
    default: 'bg-surface-container-lowest border border-surface-container-low',
    primary: 'bg-gradient-to-br from-primary to-primary-container text-white',
    gradient: 'bg-gradient-to-br from-secondary to-secondary/80 text-white',
  };

  const content = (
    <div className={`${variants[variant]} rounded-[2rem] p-7 shadow-sm ${className}`}>
      <div className="flex items-start justify-between mb-5">
        <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center ${variant !== 'default' ? 'bg-white/20' : ''}`}>
          <Icon className={`w-5 h-5 ${variant === 'default' ? iconColor : 'text-white'}`} />
        </div>
        {badge && (
          <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
            variant === 'default' 
              ? 'text-on-surface-variant bg-surface-container-low' 
              : 'text-white/90 bg-white/20'
          }`}>
            {badge}
          </span>
        )}
      </div>
      <p className={`text-[10px] uppercase tracking-[0.2em] font-bold mb-1 ${
        variant === 'default' ? 'text-on-surface-variant' : 'text-white/80'
      }`}>
        {title}
      </p>
      <h4 className={`text-3xl font-extrabold ${variant === 'default' ? 'text-on-surface' : 'text-white'}`}>
        {value}
      </h4>
      {subtitle && (
        <p className={`text-xs mt-2 ${variant === 'default' ? 'text-on-surface-variant' : 'text-white/70'}`}>
          {subtitle}
        </p>
      )}
    </div>
  );

  if (!animate) return content;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {content}
    </motion.div>
  );
}
