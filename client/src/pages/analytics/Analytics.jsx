import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
    BarChart3, TrendingUp, Award, Star,
    Users, Clock, Info, Calendar, PieChart,
    Activity, Target, Zap, RefreshCw
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import {
    RadarChart, Radar, PolarGrid, PolarAngleAxis,
    ResponsiveContainer, LineChart, Line, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, BarChart, Bar, Cell
} from 'recharts';
import { toast } from 'react-hot-toast';

// ─── ECharts dark theme config ────────────────────────────────────────────────
const ECHARTS_THEME = {
    backgroundColor: 'transparent',
    textStyle: { color: '#94a3b8', fontFamily: 'Inter, sans-serif' },
};

// ─── ABC Category Badge ───────────────────────────────────────────────────────
const ABCBadge = ({ category }) => {
    const styles = {
        A: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
        B: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
        C: 'bg-slate-500/15 text-slate-400 border-slate-500/20',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-black border ${styles[category] || styles.C}`}>
            {category}
        </span>
    );
};

// ─── Supplier Card ────────────────────────────────────────────────────────────
const SupplierCard = ({ supplier, index }) => {
    const score = (
        (supplier.qualityRating / 5) * 40 +
        (supplier.onTimeDelivery / 100) * 40 +
        ((10 - Math.min(10, supplier.avgLeadTime)) / 10) * 20
    ).toFixed(0);

    const scoreColor = score >= 80 ? 'text-emerald-400' : score >= 60 ? 'text-amber-400' : 'text-rose-400';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-2xl border border-white/[0.06] p-6 hover:border-white/[0.12] transition-all group"
        >
            <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center group-hover:border-blue-500/20 transition-colors">
                    <Users size={20} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-600 mb-0.5">Performance Score</p>
                    <span className={`text-2xl font-black ${scoreColor}`}>{score}</span>
                    <span className="text-xs text-slate-600">/100</span>
                </div>
            </div>

            <h4 className="text-base font-bold text-white mb-0.5">{supplier.name}</h4>
            <div className="flex items-center gap-1.5 mb-5">
                <div className={`w-1.5 h-1.5 rounded-full ${supplier.isActive ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                <span className="text-xs text-slate-500">{supplier.isActive ? 'Active' : 'Inactive'}</span>
                <span className="text-slate-700 mx-1">·</span>
                <Star size={10} className="text-amber-400" />
                <span className="text-xs text-amber-400 font-semibold">{supplier.qualityRating}</span>
            </div>

            <div className="space-y-3">
                {[
                    { label: 'On-time Delivery', value: supplier.onTimeDelivery, suffix: '%', color: 'bg-emerald-500' },
                    { label: 'Quality Rating', value: (supplier.qualityRating / 5) * 100, suffix: '', display: `${supplier.qualityRating}/5`, color: 'bg-blue-500' },
                    { label: 'Lead Time', value: Math.max(0, 100 - supplier.avgLeadTime * 10), suffix: '', display: `${supplier.avgLeadTime}d`, color: 'bg-violet-500' },
                ].map(metric => (
                    <div key={metric.label}>
                        <div className="flex justify-between text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                            <span>{metric.label}</span>
                            <span className="text-slate-300">{metric.display || `${metric.value}${metric.suffix}`}</span>
                        </div>
                        <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${metric.value}%` }}
                                transition={{ duration: 1, delay: index * 0.1 + 0.3, ease: 'easeOut' }}
                                className={`h-full rounded-full ${metric.color}`}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};

// ─── Main Analytics Page ──────────────────────────────────────────────────────
const Analytics = () => {
    const [abcData, setAbcData] = useState([]);
    const [forecastData, setForecastData] = useState([]);
    const [supplierData, setSupplierData] = useState([]);
    const [healthData, setHealthData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            const [abc, forecast, suppliers, health] = await Promise.all([
                axios.get('/api/analytics/abc-analysis'),
                axios.get('/api/analytics/forecast'),
                axios.get('/api/analytics/suppliers'),
                axios.get('/api/analytics/inventory-health'),
            ]);
            if (abc.data.success) setAbcData(abc.data.data);
            if (forecast.data.success) setForecastData(forecast.data.data);
            if (suppliers.data.success) setSupplierData(suppliers.data.data);
            if (health.data.success) setHealthData(health.data);
        } catch (err) {
            toast.error('Failed to load analytics');
        } finally {
            setLoading(false);
        }
    };

    // ─── ECharts: ABC Treemap ─────────────────────────────────────────────────
    const treemapOption = {
        backgroundColor: 'transparent',
        tooltip: {
            formatter: (info) => `${info.name}<br/>Revenue: $${info.value?.toLocaleString()}`
        },
        series: [{
            type: 'treemap',
            data: abcData.map(item => ({
                name: item.name,
                value: item.revenue,
                itemStyle: {
                    color: item.category === 'A' ? '#10b981' : item.category === 'B' ? '#3b82f6' : '#64748b',
                    borderColor: 'rgba(0,0,0,0.3)',
                    borderWidth: 2,
                    gapWidth: 3,
                }
            })),
            label: {
                show: true,
                formatter: '{b}',
                color: '#fff',
                fontSize: 11,
                fontWeight: 'bold',
            },
            breadcrumb: { show: false },
            roam: false,
        }]
    };

    // ─── ECharts: Radar for supplier comparison ───────────────────────────────
    const radarOption = {
        backgroundColor: 'transparent',
        tooltip: {},
        legend: {
            data: supplierData.map(s => s.name),
            textStyle: { color: '#94a3b8', fontSize: 11 },
            bottom: 0,
        },
        radar: {
            indicator: [
                { name: 'Quality', max: 5 },
                { name: 'On-Time %', max: 100 },
                { name: 'Speed', max: 10 },
                { name: 'Reliability', max: 100 },
                { name: 'Score', max: 100 },
            ],
            axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
            splitArea: { areaStyle: { color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.01)'] } },
            name: { textStyle: { color: '#64748b', fontSize: 11 } },
        },
        series: [{
            type: 'radar',
            data: supplierData.map((s, i) => ({
                name: s.name,
                value: [
                    s.qualityRating,
                    s.onTimeDelivery,
                    10 - Math.min(10, s.avgLeadTime),
                    s.onTimeDelivery,
                    parseFloat(((s.qualityRating / 5) * 40 + (s.onTimeDelivery / 100) * 40 + ((10 - Math.min(10, s.avgLeadTime)) / 10) * 20).toFixed(0))
                ],
                lineStyle: { width: 2 },
                areaStyle: { opacity: 0.1 },
            })),
            color: ['#3b82f6', '#10b981', '#8b5cf6'],
        }]
    };

    // ─── ECharts: Forecast with confidence band ───────────────────────────────
    const forecastOption = {
        backgroundColor: 'transparent',
        tooltip: {
            trigger: 'axis',
            backgroundColor: 'rgba(10,15,30,0.95)',
            borderColor: 'rgba(255,255,255,0.1)',
            textStyle: { color: '#e2e8f0', fontSize: 12 },
        },
        legend: {
            data: ['Actual Revenue', 'AI Forecast'],
            textStyle: { color: '#94a3b8', fontSize: 11 },
            top: 0,
        },
        grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
        xAxis: {
            type: 'category',
            data: forecastData.map(d => d.month),
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#475569', fontSize: 10 },
            splitLine: { show: false },
        },
        yAxis: {
            type: 'value',
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#475569', fontSize: 10, formatter: v => `$${(v/1000).toFixed(0)}k` },
            splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
        },
        series: [
            {
                name: 'Actual Revenue',
                type: 'line',
                data: forecastData.map(d => d.actual),
                smooth: true,
                lineStyle: { color: '#3b82f6', width: 3 },
                itemStyle: { color: '#3b82f6' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59,130,246,0.2)' },
                            { offset: 1, color: 'rgba(59,130,246,0)' }
                        ]
                    }
                },
                symbol: 'circle',
                symbolSize: 6,
            },
            {
                name: 'AI Forecast',
                type: 'line',
                data: forecastData.map(d => d.predicted),
                smooth: true,
                lineStyle: { color: '#10b981', width: 2.5, type: 'dashed' },
                itemStyle: { color: '#10b981' },
                areaStyle: {
                    color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(16,185,129,0.1)' },
                            { offset: 1, color: 'rgba(16,185,129,0)' }
                        ]
                    }
                },
                symbol: 'none',
            }
        ]
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: BarChart3 },
        { id: 'abc', label: 'ABC Analysis', icon: PieChart },
        { id: 'forecast', label: 'Forecasting', icon: TrendingUp },
        { id: 'suppliers', label: 'Suppliers', icon: Award },
    ];

    if (loading) {
        return (
            <div className="space-y-5">
                <div className="skeleton h-12 rounded-2xl w-96" />
                <div className="grid grid-cols-2 gap-5">
                    <div className="skeleton h-80 rounded-2xl" />
                    <div className="skeleton h-80 rounded-2xl" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Business Intelligence</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        AI-powered analytics · ABC classification · Forecasting
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-white/[0.08] text-sm text-slate-400 hover:text-white transition-colors"
                >
                    <RefreshCw size={14} /> Refresh
                </button>
            </motion.div>

            {/* ─── Tabs ────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-1 p-1 glass rounded-xl border border-white/[0.06] w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            activeTab === tab.id
                                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                                : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                        <tab.icon size={14} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ─── Overview Tab ────────────────────────────────────────────────── */}
            {activeTab === 'overview' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                >
                    {/* Inventory Health Summary */}
                    {healthData && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {[
                                { label: 'Healthy Stock', value: healthData.summary.healthy, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                                { label: 'Low Stock', value: healthData.summary.low, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                                { label: 'Out of Stock', value: healthData.summary.out, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                                { label: 'Total Value', value: `$${(healthData.summary.totalValue / 1000).toFixed(0)}k`, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            ].map((item, i) => (
                                <motion.div
                                    key={item.label}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`glass rounded-xl border border-white/[0.06] p-4 ${item.bg}`}
                                >
                                    <p className="text-xs text-slate-500 mb-1">{item.label}</p>
                                    <p className={`text-2xl font-black ${item.color}`}>{item.value}</p>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* Treemap + Radar */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="glass rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart size={16} className="text-blue-400" />
                                <h3 className="text-sm font-bold text-white">Revenue Treemap (ABC)</h3>
                            </div>
                            <div className="h-64">
                                <ReactECharts option={treemapOption} style={{ height: '100%' }} theme={ECHARTS_THEME} />
                            </div>
                            <div className="flex items-center gap-4 mt-3">
                                {[
                                    { label: 'Class A (Top 80%)', color: 'bg-emerald-500' },
                                    { label: 'Class B (80-95%)', color: 'bg-blue-500' },
                                    { label: 'Class C (Tail)', color: 'bg-slate-500' },
                                ].map(item => (
                                    <div key={item.label} className="flex items-center gap-1.5">
                                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                        <span className="text-[10px] text-slate-500">{item.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass rounded-2xl border border-white/[0.06] p-5">
                            <div className="flex items-center gap-2 mb-4">
                                <Activity size={16} className="text-violet-400" />
                                <h3 className="text-sm font-bold text-white">Supplier Comparison Radar</h3>
                            </div>
                            <div className="h-64">
                                <ReactECharts option={radarOption} style={{ height: '100%' }} theme={ECHARTS_THEME} />
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ─── ABC Analysis Tab ────────────────────────────────────────────── */}
            {activeTab === 'abc' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="glass rounded-2xl border border-white/[0.06] overflow-hidden"
                >
                    <div className="px-6 py-5 border-b border-white/[0.06]">
                        <h3 className="text-base font-bold text-white">ABC Classification Analysis</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Pareto principle: 80% of revenue from 20% of products</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Product</th>
                                    <th>Class</th>
                                    <th>Revenue</th>
                                    <th>Units Sold</th>
                                    <th>Cumulative %</th>
                                    <th>Revenue Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {abcData.map((item, i) => {
                                    const totalRev = abcData.reduce((s, d) => s + d.revenue, 0);
                                    const share = totalRev > 0 ? ((item.revenue / totalRev) * 100).toFixed(1) : 0;
                                    return (
                                        <motion.tr
                                            key={item.productId}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: i * 0.03 }}
                                        >
                                            <td className="text-slate-600 text-xs font-mono">{String(i + 1).padStart(2, '0')}</td>
                                            <td>
                                                <p className="text-sm font-semibold text-white">{item.name}</p>
                                            </td>
                                            <td><ABCBadge category={item.category} /></td>
                                            <td>
                                                <span className="text-sm font-bold text-white">${item.revenue.toLocaleString()}</span>
                                            </td>
                                            <td>
                                                <span className="text-sm text-slate-400">{item.quantitySold}</span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-20 h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-blue-500 rounded-full"
                                                            style={{ width: `${item.cumulativePercentage}%` }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-slate-500">{item.cumulativePercentage}%</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="text-xs text-slate-400">{share}%</span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="px-6 py-4 border-t border-white/[0.06] flex items-start gap-3">
                        <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-slate-500 leading-relaxed">
                            <strong className="text-slate-300">Class A</strong> products drive 80% of revenue — never let these go out of stock.
                            <strong className="text-slate-300"> Class B</strong> products contribute 15% — monitor regularly.
                            <strong className="text-slate-300"> Class C</strong> products are slow movers — consider reducing inventory investment.
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ─── Forecast Tab ────────────────────────────────────────────────── */}
            {activeTab === 'forecast' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                >
                    <div className="glass rounded-2xl border border-white/[0.06] p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-base font-bold text-white flex items-center gap-2">
                                    <TrendingUp size={16} className="text-emerald-400" />
                                    AI Revenue Forecast
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">Linear regression model · 3-month projection</p>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <Zap size={12} className="text-emerald-400" />
                                <span className="text-xs text-emerald-400 font-semibold">AI Powered</span>
                            </div>
                        </div>
                        <div className="h-72">
                            <ReactECharts option={forecastOption} style={{ height: '100%' }} theme={ECHARTS_THEME} />
                        </div>
                    </div>

                    {/* Forecast table */}
                    <div className="glass rounded-2xl border border-white/[0.06] overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/[0.06]">
                            <h3 className="text-sm font-bold text-white">Monthly Breakdown</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th>Month</th>
                                        <th>Actual Revenue</th>
                                        <th>AI Prediction</th>
                                        <th>Variance</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {forecastData.map((row, i) => {
                                        const variance = row.actual && row.predicted
                                            ? (((row.predicted - row.actual) / row.actual) * 100).toFixed(1)
                                            : null;
                                        return (
                                            <tr key={i}>
                                                <td className="font-mono text-sm text-slate-300">{row.month}</td>
                                                <td>
                                                    {row.actual != null
                                                        ? <span className="text-sm font-bold text-white">${row.actual.toLocaleString()}</span>
                                                        : <span className="text-slate-600">—</span>
                                                    }
                                                </td>
                                                <td>
                                                    <span className="text-sm font-semibold text-emerald-400">${row.predicted?.toLocaleString()}</span>
                                                </td>
                                                <td>
                                                    {variance != null && (
                                                        <span className={`text-xs font-semibold ${parseFloat(variance) >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {parseFloat(variance) >= 0 ? '+' : ''}{variance}%
                                                        </span>
                                                    )}
                                                </td>
                                                <td>
                                                    {row.isForecast
                                                        ? <span className="badge badge-green text-[10px]">Forecast</span>
                                                        : <span className="badge badge-blue text-[10px]">Historical</span>
                                                    }
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ─── Suppliers Tab ───────────────────────────────────────────────── */}
            {activeTab === 'suppliers' && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-5"
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {supplierData.map((supplier, i) => (
                            <SupplierCard key={supplier._id} supplier={supplier} index={i} />
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default Analytics;
