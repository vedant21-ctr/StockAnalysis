import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, ShoppingCart, Package, AlertTriangle, User, Check, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const iconMap = {
    sale: { icon: ShoppingCart, color: 'text-blue-400', bg: 'bg-blue-500/15' },
    stock: { icon: Package, color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
    alert: { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/15' },
    user: { icon: User, color: 'text-violet-400', bg: 'bg-violet-500/15' },
};

const NotificationItem = ({ notification, onDismiss }) => {
    const config = iconMap[notification.type] || iconMap.user;
    const Icon = config.icon;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, x: 20, height: 0 }}
            animate={{ opacity: 1, x: 0, height: 'auto' }}
            exit={{ opacity: 0, x: 20, height: 0 }}
            className="flex items-start gap-3 p-3 rounded-xl hover:bg-white/[0.04] transition-colors group"
        >
            <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${config.bg}`}>
                <Icon size={14} className={config.color} />
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-300 leading-snug">{notification.message}</p>
                {notification.amount && (
                    <p className="text-xs text-blue-400 font-semibold mt-0.5">
                        +${notification.amount.toLocaleString()}
                    </p>
                )}
                <p className="text-xs text-slate-600 mt-1">
                    {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                </p>
            </div>
            <button
                onClick={() => onDismiss(notification.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/[0.06] text-slate-600 hover:text-slate-400 transition-all"
            >
                <X size={12} />
            </button>
        </motion.div>
    );
};

const NotificationCenter = ({ notifications, onDismiss, onClearAll, isOpen, onClose }) => {
    const unreadCount = notifications.length;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[90]"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        className="absolute right-0 top-full mt-2 w-80 z-[100] glass rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                            <div className="flex items-center gap-2">
                                <Bell size={16} className="text-slate-400" />
                                <span className="text-sm font-semibold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                            {unreadCount > 0 && (
                                <button
                                    onClick={onClearAll}
                                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 size={12} /> Clear all
                                </button>
                            )}
                        </div>

                        {/* Notifications list */}
                        <div className="max-h-80 overflow-y-auto p-2">
                            <AnimatePresence mode="popLayout">
                                {notifications.length === 0 ? (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="py-8 text-center"
                                    >
                                        <Check size={24} className="text-slate-700 mx-auto mb-2" />
                                        <p className="text-sm text-slate-600">All caught up!</p>
                                    </motion.div>
                                ) : (
                                    notifications.map(n => (
                                        <NotificationItem
                                            key={n.id}
                                            notification={n}
                                            onDismiss={onDismiss}
                                        />
                                    ))
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default NotificationCenter;
