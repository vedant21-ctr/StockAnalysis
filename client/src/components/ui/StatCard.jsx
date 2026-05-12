import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

const colorMap = {
    blue: {
        icon: 'bg-blue-500/15 text-blue-400',
        glow: 'shadow-glow-blue',
        border: 'hover:border-blue-500/20',
        badge: 'bg-blue-500/10 text-blue-400',
        bar: 'bg-blue-500',
    },
    green: {
        icon: 'bg-emerald-500/15 text-emerald-400',
        glow: 'shadow-glow-green',
        border: 'hover:border-emerald-500/20',
        badge: 'bg-emerald-500/10 text-emerald-400',
        bar: 'bg-emerald-500',
    },
    purple: {
        icon: 'bg-violet-500/15 text-violet-400',
        glow: 'shadow-glow-purple',
        border: 'hover:border-violet-500/20',
        badge: 'bg-violet-500/10 text-violet-400',
        bar: 'bg-violet-500',
    },
    amber: {
        icon: 'bg-amber-500/15 text-amber-400',
        glow: 'shadow-glow-amber',
        border: 'hover:border-amber-500/20',
        badge: 'bg-amber-500/10 text-amber-400',
        bar: 'bg-amber-500',
    },
    rose: {
        icon: 'bg-rose-500/15 text-rose-400',
        glow: '',
        border: 'hover:border-rose-500/20',
        badge: 'bg-rose-500/10 text-rose-400',
        bar: 'bg-rose-500',
    },
};

const StatCard = ({
    title,
    value,
    icon: Icon,
    color = 'blue',
    trend,
    trendValue,
    prefix = '',
    suffix = '',
    decimals = 0,
    subtitle,
    delay = 0,
}) => {
    const colors = colorMap[color] || colorMap.blue;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay, ease: 'easeOut' }}
            className={`stat-card border border-white/[0.06] ${colors.border} group cursor-default`}
        >
            {/* Background glow */}
            <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${colors.glow}`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${colors.icon} transition-transform duration-300 group-hover:scale-110`}>
                        <Icon size={22} />
                    </div>

                    {trend && (
                        <div className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full ${
                            trend === 'up'
                                ? 'bg-emerald-500/10 text-emerald-400'
                                : 'bg-rose-500/10 text-rose-400'
                        }`}>
                            {trend === 'up'
                                ? <TrendingUp size={12} />
                                : <TrendingDown size={12} />
                            }
                            {trendValue}%
                        </div>
                    )}
                </div>

                <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
                <h3 className="text-2xl font-black text-white tracking-tight">
                    <AnimatedCounter
                        value={value}
                        prefix={prefix}
                        suffix={suffix}
                        decimals={decimals}
                    />
                </h3>

                {subtitle && (
                    <p className="text-xs text-slate-600 mt-1.5">{subtitle}</p>
                )}
            </div>
        </motion.div>
    );
};

export default StatCard;
