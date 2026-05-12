import { motion } from 'framer-motion';

export const SkeletonCard = ({ className = '' }) => (
    <div className={`skeleton h-32 ${className}`} />
);

export const SkeletonRow = ({ cols = 5 }) => (
    <tr>
        {Array.from({ length: cols }).map((_, i) => (
            <td key={i} className="px-6 py-4">
                <div className="skeleton h-4 rounded-lg" style={{ width: `${60 + Math.random() * 40}%` }} />
            </td>
        ))}
    </tr>
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <div
                key={i}
                className="skeleton h-3 rounded"
                style={{ width: i === lines - 1 ? '60%' : '100%' }}
            />
        ))}
    </div>
);

export const PageLoader = () => (
    <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center bg-surface-0"
    >
        <div className="flex flex-col items-center gap-6">
            {/* Logo */}
            <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-glow-blue">
                    <span className="text-white font-black text-2xl">S</span>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
            </div>

            {/* Loading bar */}
            <div className="w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                />
            </div>

            <p className="text-slate-500 text-sm font-medium tracking-widest uppercase">
                Loading SmartStock AI
            </p>
        </div>
    </motion.div>
);

export default SkeletonCard;
