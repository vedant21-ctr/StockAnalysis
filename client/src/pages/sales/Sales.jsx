import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ShoppingCart, Plus, X, User, ChevronDown,
    CheckCircle2, TrendingUp, DollarSign, Package,
    Clock, Search, RefreshCw, BarChart3, Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import AnimatedCounter from '../../components/ui/AnimatedCounter';
import { useSocket } from '../../context/SocketContext';

// ─── Record Sale Modal ────────────────────────────────────────────────────────
const RecordSaleModal = ({ isOpen, onClose, products, onSuccess }) => {
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [customerName, setCustomerName] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const reset = () => {
        setSelectedProduct(null);
        setQuantity(1);
        setCustomerName('');
    };

    const handleClose = () => { reset(); onClose(); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedProduct) return toast.error('Select a product');
        setSubmitting(true);
        try {
            await axios.post('/api/sales', {
                product: selectedProduct._id,
                quantity: parseInt(quantity),
                customerName: customerName || 'Walk-in Customer'
            });
            toast.success('Sale recorded successfully!');
            onSuccess();
            handleClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Transaction failed');
        } finally {
            setSubmitting(false);
        }
    };

    const total = selectedProduct ? selectedProduct.price * quantity : 0;
    const availableProducts = products.filter(p => p.stockQuantity > 0);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 modal-backdrop"
                        onClick={handleClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-md glass rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                    <ShoppingCart size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">New Transaction</h2>
                                    <p className="text-xs text-slate-500">Record a sale</p>
                                </div>
                            </div>
                            <button onClick={handleClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {/* Product select */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Product</label>
                                <div className="relative">
                                    <select
                                        className="input-field text-sm appearance-none pr-8"
                                        onChange={e => setSelectedProduct(availableProducts.find(p => p._id === e.target.value) || null)}
                                        required
                                    >
                                        <option value="">Choose a product...</option>
                                        {availableProducts.map(p => (
                                            <option key={p._id} value={p._id}>
                                                {p.name} — ${p.price} ({p.stockQuantity} in stock)
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                </div>
                            </div>

                            {/* Stock info */}
                            {selectedProduct && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]"
                                >
                                    <span className="text-xs text-slate-500">Available stock</span>
                                    <span className={`text-sm font-bold ${selectedProduct.stockQuantity < 10 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                        {selectedProduct.stockQuantity} units
                                    </span>
                                </motion.div>
                            )}

                            {/* Quantity + Total */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Quantity</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={selectedProduct?.stockQuantity || 999}
                                        value={quantity}
                                        onChange={e => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="input-field text-sm"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Total</label>
                                    <div className="input-field text-sm font-black text-blue-400 flex items-center">
                                        ${total.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Customer */}
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">Customer (Optional)</label>
                                <div className="relative">
                                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                                    <input
                                        type="text"
                                        placeholder="Walk-in Customer"
                                        value={customerName}
                                        onChange={e => setCustomerName(e.target.value)}
                                        className="input-field text-sm pl-9"
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || !selectedProduct}
                                className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 mt-2"
                            >
                                {submitting
                                    ? <RefreshCw size={16} className="animate-spin" />
                                    : <><CheckCircle2 size={16} /> Process Sale</>
                                }
                            </button>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── Main Sales Page ──────────────────────────────────────────────────────────
const Sales = () => {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [dailyData, setDailyData] = useState([]);
    const [categoryData, setCategoryData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const { liveSales } = useSocket();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [salesRes, prodRes, dailyRes, catRes] = await Promise.all([
                axios.get('/api/sales'),
                axios.get('/api/inventory/products'),
                axios.get('/api/sales/daily'),
                axios.get('/api/sales/by-category'),
            ]);
            if (salesRes.data.success) setSales(salesRes.data.data);
            if (prodRes.data.success) setProducts(prodRes.data.data);
            if (dailyRes.data.success) setDailyData(dailyRes.data.data);
            if (catRes.data.success) setCategoryData(catRes.data.data);
        } catch (err) {
            toast.error('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const totalRevenue = useMemo(() => sales.reduce((s, sale) => s + sale.totalAmount, 0), [sales]);
    const todayRevenue = useMemo(() => {
        const today = new Date().toDateString();
        return sales
            .filter(s => new Date(s.saleDate).toDateString() === today)
            .reduce((s, sale) => s + sale.totalAmount, 0);
    }, [sales]);

    const filteredSales = useMemo(() =>
        sales.filter(s =>
            s.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
        ), [sales, searchTerm]);

    const CAT_COLORS = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-5">
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Sales</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {sales.length} transactions · ${totalRevenue.toLocaleString()} total revenue
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={16} /> Record Sale
                </button>
            </motion.div>

            {/* ─── KPI Row ────────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: "Today's Revenue", value: todayRevenue, prefix: '$', icon: Zap, color: 'text-blue-400' },
                    { label: 'Total Revenue', value: totalRevenue, prefix: '$', icon: DollarSign, color: 'text-emerald-400' },
                    { label: 'Transactions', value: sales.length, icon: ShoppingCart, color: 'text-violet-400' },
                    { label: 'Products Sold', value: sales.reduce((s, sale) => s + sale.quantity, 0), icon: Package, color: 'text-amber-400' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl border border-white/[0.06] p-4"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <item.icon size={14} className={item.color} />
                            <span className="text-xs text-slate-500">{item.label}</span>
                        </div>
                        <p className="text-xl font-black text-white">
                            {item.prefix}<AnimatedCounter value={item.value} />
                        </p>
                    </motion.div>
                ))}
            </div>

            {/* ─── Charts Row ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Daily Revenue Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="lg:col-span-2 glass rounded-2xl border border-white/[0.06] p-5"
                >
                    <h3 className="text-sm font-bold text-white mb-4">Daily Revenue (Last 30 Days)</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={dailyData} margin={{ top: 5, right: 5, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.04)" />
                                <XAxis dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => v?.slice(8)} interval={4} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    labelStyle={{ color: '#94a3b8', fontSize: 11 }}
                                    itemStyle={{ color: '#60a5fa', fontWeight: 'bold' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#salesGrad)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Category breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="glass rounded-2xl border border-white/[0.06] p-5"
                >
                    <h3 className="text-sm font-bold text-white mb-4">By Category</h3>
                    <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 10 }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                                <YAxis type="category" dataKey="_id" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} width={70} />
                                <Tooltip
                                    contentStyle={{ background: 'rgba(10,15,30,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                    formatter={v => [`$${v.toLocaleString()}`, 'Revenue']}
                                />
                                <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                                    {categoryData.map((_, i) => (
                                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* ─── Transaction Table ───────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="glass rounded-2xl border border-white/[0.06] overflow-hidden"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                    <h3 className="text-sm font-bold text-white">Transaction History</h3>
                    <div className="relative">
                        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Search..."
                            className="input-field text-xs py-1.5 pl-8 w-44"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Transaction</th>
                                <th>Customer</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Amount</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <tr key={i}>
                                        {[...Array(7)].map((_, j) => (
                                            <td key={j}><div className="skeleton h-4 rounded" /></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="py-16 text-center">
                                        <ShoppingCart size={32} className="text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">No transactions found</p>
                                    </td>
                                </tr>
                            ) : filteredSales.slice(0, 20).map((sale, i) => (
                                <motion.tr
                                    key={sale._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.02 }}
                                >
                                    <td>
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                                                <Clock size={12} className="text-blue-400" />
                                            </div>
                                            <span className="text-[10px] font-mono text-slate-500">
                                                TXN-{sale._id.slice(-6).toUpperCase()}
                                            </span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm text-slate-300">{sale.customerName}</span>
                                    </td>
                                    <td>
                                        <div>
                                            <p className="text-sm font-medium text-white">{sale.productName || sale.product?.name}</p>
                                            <p className="text-[10px] text-slate-600">${sale.unitPrice}/unit</p>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="text-sm font-bold text-white">×{sale.quantity}</span>
                                    </td>
                                    <td>
                                        <span className="text-sm font-black text-blue-400">${sale.totalAmount.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <span className="text-xs text-slate-500">
                                            {format(new Date(sale.saleDate), 'MMM d, HH:mm')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="badge badge-green text-[10px]">
                                            <CheckCircle2 size={9} /> Complete
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            {/* Modal */}
            <RecordSaleModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                products={products}
                onSuccess={loadData}
            />
        </div>
    );
};

export default Sales;
