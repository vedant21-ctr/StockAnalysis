import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign, TrendingUp, Package, AlertTriangle,
    ShoppingCart, BarChart3, ArrowUpRight, Zap,
    Activity, RefreshCw, Eye, ChevronRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import StatCard from '../../components/ui/StatCard';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { useSocket } from '../../context/SocketContext';

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="glass rounded-xl px-4 py-3 border border-white/[0.1] shadow-2xl">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            {payload.map((p, i) => (
                <p key={i} className="text-sm font-bold" style={{ color: p.color }}>
                    ${p.value?.toLocaleString()}
                </p>
            ))}
        </div>
    );
};

// ─── Live Activity Feed ───────────────────────────────────────────────────────
const LiveFeed = ({ liveSales }) => (
    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h3 className="text-sm font-semibold text-white">Live Activity</h3>
            </div>
            <span className="text-xs text-slate-600">Real-time</span>
        </div>
        <div className="divide-y divide-white/[0.04] max-h-64 overflow-y-auto">
            <AnimatePresence mode="popLayout">
                {liveSales.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <Activity size={20} className="text-slate-700 mx-auto mb-2" />
                        <p className="text-xs text-slate-600">Waiting for activity...</p>
                    </div>
                ) : liveSales.map((sale, i) => (
                    <motion.div
                        key={sale.id || i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-3 px-5 py-3"
                    >
                        <div className="w-7 h-7 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart size={12} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-300 truncate">{sale.productName}</p>
                            <p className="text-[10px] text-slate-600">{sale.customerName} · ×{sale.quantity}</p>
                        </div>
                        <span className="text-xs font-bold text-emerald-400">
                            +${sale.totalAmount?.toLocaleString()}
                        </span>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    </div>
);

// ─── Category Breakdown ───────────────────────────────────────────────────────
const CATEGORY_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

const CategoryChart = ({ data }) => {
    if (!data?.length) return null;
    const total = data.reduce((s, d) => s + d.revenue, 0);

    return (
        <div className="glass rounded-2xl border border-white/[0.06] p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Revenue by Category</h3>
            <div className="flex items-center gap-4">
                <div className="w-28 h-28 flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="revenue"
                                nameKey="_id"
                                cx="50%"
                                cy="50%"
                                innerRadius={28}
                                outerRadius={50}
                                strokeWidth={0}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                    {data.slice(0, 4).map((cat, i) => (
                        <div key={cat._id} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                            <span className="text-xs text-slate-400 flex-1 truncate">{cat._id}</span>
                            <span className="text-xs font-bold text-white">
                                {total > 0 ? ((cat.revenue / total) * 100).toFixed(0) : 0}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const { liveSales } = useSocket();

    const fetchDashboardData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        try {
            const [execRes, forecastRes] = await Promise.all([
                axios.get('/api/analytics/executive'),
                axios.get('/api/analytics/forecast'),
            ]);

            if (execRes.data.success) setStats(execRes.data.data);
            if (forecastRes.data.success) setChartData(forecastRes.data.data);
        } catch (err) {
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map(i => (
                        <div key={i} className="skeleton h-32 rounded-2xl" />
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 skeleton h-80 rounded-2xl" />
                    <div className="skeleton h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    // Format chart data
    const areaData = chartData.map(d => ({
        month: d.month?.slice(5) || d.month,
        actual: d.actual,
        predicted: d.predicted,
        isForecast: d.isForecast
    }));

    return (
        <div className="space-y-6">
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">
                        Executive Dashboard
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {format(new Date(), 'EEEE, MMMM d, yyyy')} · Real-time business intelligence
                    </p>
                </div>
                <button
                    onClick={() => fetchDashboardData(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/[0.08] text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </motion.div>

            {/* ─── KPI Cards ──────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Revenue"
                    value={stats?.totalRevenue || 0}
                    icon={DollarSign}
                    color="blue"
                    trend="up"
                    trendValue="12.4"
                    prefix="$"
                    delay={0}
                />
                <StatCard
                    title="Total Profit"
                    value={stats?.totalProfit || 0}
                    icon={TrendingUp}
                    color="green"
                    trend="up"
                    trendValue="8.1"
                    prefix="$"
                    delay={0.05}
                />
                <StatCard
                    title="Inventory Value"
                    value={stats?.inventoryValue || 0}
                    icon={Package}
                    color="purple"
                    prefix="$"
                    delay={0.1}
                />
                <StatCard
                    title="Low Stock Items"
                    value={stats?.lowStock || 0}
                    icon={AlertTriangle}
                    color="amber"
                    trend={stats?.lowStock > 0 ? 'down' : undefined}
                    trendValue="3"
                    subtitle={`${stats?.outOfStock || 0} out of stock`}
                    delay={0.15}
                />
            </div>

            {/* ─── Charts Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="lg:col-span-2 glass rounded-2xl border border-white/[0.06] p-6"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-white">Revenue Trend</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Actual vs AI-predicted revenue</p>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-500">
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-0.5 bg-blue-500 rounded" />
                                Actual
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="w-3 h-0.5 bg-emerald-500 rounded border-dashed" style={{ borderTop: '2px dashed' }} />
                                Forecast
                            </span>
                        </div>
                    </div>
                    <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={areaData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 11 }}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#475569', fontSize: 11 }}
                                    dx={-8}
                                    tickFormatter={v => `$${(v / 1000).toFixed(0)}k`}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="actual"
                                    stroke="#3b82f6"
                                    strokeWidth={2.5}
                                    fill="url(#gradBlue)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="predicted"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    strokeDasharray="6 3"
                                    fill="url(#gradGreen)"
                                    dot={false}
                                    activeDot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Right column */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="space-y-4"
                >
                    {/* Profit Margin Card */}
                    <div className="glass rounded-2xl border border-white/[0.06] p-5 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-violet-600/5" />
                        <div className="relative z-10">
                            <p className="text-xs text-slate-500 font-medium mb-1">Profit Margin</p>
                            <div className="flex items-end gap-2">
                                <span className="text-4xl font-black text-white">
                                    <AnimatedCounter value={stats?.profitMargin || 0} decimals={1} suffix="%" />
                                </span>
                                <span className="text-xs text-emerald-400 mb-1.5 flex items-center gap-0.5">
                                    <ArrowUpRight size={12} /> Growing
                                </span>
                            </div>
                            <div className="mt-3 w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, parseFloat(stats?.profitMargin) * 2)}%` }}
                                    transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Quick stats */}
                    <div className="glass rounded-2xl border border-white/[0.06] p-5 space-y-3">
                        <h3 className="text-sm font-semibold text-white">Quick Stats</h3>
                        {[
                            { label: 'Total Transactions', value: stats?.totalSalesCount || 0, icon: ShoppingCart, color: 'text-blue-400' },
                            { label: 'Total Products', value: stats?.totalProducts || 0, icon: Package, color: 'text-violet-400' },
                            { label: 'Out of Stock', value: stats?.outOfStock || 0, icon: AlertTriangle, color: 'text-rose-400' },
                        ].map(item => (
                            <div key={item.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                    <item.icon size={14} className={item.color} />
                                    <span className="text-xs text-slate-400">{item.label}</span>
                                </div>
                                <span className="text-sm font-bold text-white">
                                    <AnimatedCounter value={item.value} />
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Category chart */}
                    {stats?.categoryBreakdown?.length > 0 && (
                        <CategoryChart data={stats.categoryBreakdown} />
                    )}
                </motion.div>
            </div>

            {/* ─── Bottom Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Monthly Revenue Bar Chart */}
                {stats?.monthlyRevenue?.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="glass rounded-2xl border border-white/[0.06] p-6"
                    >
                        <h3 className="text-sm font-bold text-white mb-4">Monthly Revenue</h3>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.monthlyRevenue} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                    <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => v?.slice(5)} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                                        {stats.monthlyRevenue.map((_, i) => (
                                            <Cell
                                                key={i}
                                                fill={i === stats.monthlyRevenue.length - 1 ? '#3b82f6' : 'rgba(59,130,246,0.3)'}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>
                )}

                {/* Live Activity Feed */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                >
                    <LiveFeed liveSales={liveSales} />
                </motion.div>
            </div>
        </div>
    );
};

export default Dashboard;
