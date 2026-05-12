import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Search, Package, Trash2, Edit2,
    ChevronLeft, ChevronRight, TrendingDown, AlertCircle,
    CheckCircle, Filter, X, SlidersHorizontal, RefreshCw,
    ArrowUpDown, Tag, DollarSign, Layers
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';

const ITEMS_PER_PAGE = 8;

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ quantity, threshold }) => {
    if (quantity === 0) return (
        <span className="badge badge-red">
            <AlertCircle size={10} /> Out of Stock
        </span>
    );
    if (quantity <= threshold) return (
        <span className="badge badge-amber">
            <TrendingDown size={10} /> Low Stock
        </span>
    );
    return (
        <span className="badge badge-green">
            <CheckCircle size={10} /> In Stock
        </span>
    );
};

// ─── Stock Bar ────────────────────────────────────────────────────────────────
const StockBar = ({ quantity, threshold }) => {
    const pct = threshold > 0 ? Math.min(100, (quantity / (threshold * 3)) * 100) : 100;
    const color = quantity === 0 ? 'bg-rose-500' : quantity <= threshold ? 'bg-amber-500' : 'bg-emerald-500';

    return (
        <div className="w-20 h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${color}`}
            />
        </div>
    );
};

// ─── Add/Edit Product Modal ───────────────────────────────────────────────────
const ProductModal = ({ isOpen, onClose, onSuccess, suppliers, editProduct = null }) => {
    const [formData, setFormData] = useState({
        name: '', sku: '', category: '', price: '',
        costPrice: '', stockQuantity: '', reorderThreshold: '', supplier: ''
    });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (editProduct) {
            setFormData({
                name: editProduct.name || '',
                sku: editProduct.sku || '',
                category: editProduct.category || '',
                price: editProduct.price || '',
                costPrice: editProduct.costPrice || '',
                stockQuantity: editProduct.stockQuantity || '',
                reorderThreshold: editProduct.reorderThreshold || '',
                supplier: editProduct.supplier?._id || editProduct.supplier || ''
            });
        } else {
            setFormData({ name: '', sku: '', category: '', price: '', costPrice: '', stockQuantity: '', reorderThreshold: '', supplier: '' });
        }
    }, [editProduct, isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editProduct) {
                await axios.put(`/api/inventory/products/${editProduct._id}`, formData);
                toast.success('Product updated successfully');
            } else {
                await axios.post('/api/inventory/products', formData);
                toast.success('Product added successfully');
            }
            onSuccess();
            onClose();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Operation failed');
        } finally {
            setSubmitting(false);
        }
    };

    const fields = [
        { key: 'name', label: 'Product Name', type: 'text', colSpan: 2, required: true },
        { key: 'sku', label: 'SKU Code', type: 'text', required: true },
        { key: 'category', label: 'Category', type: 'text', required: true },
        { key: 'price', label: 'Selling Price ($)', type: 'number', required: true },
        { key: 'costPrice', label: 'Cost Price ($)', type: 'number', required: true },
        { key: 'stockQuantity', label: 'Initial Stock', type: 'number', required: true },
        { key: 'reorderThreshold', label: 'Reorder Level', type: 'number', required: true },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 modal-backdrop"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg glass rounded-2xl border border-white/[0.1] shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-500/15 flex items-center justify-center">
                                    <Package size={18} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-white">
                                        {editProduct ? 'Edit Product' : 'New Product'}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {editProduct ? 'Update product details' : 'Add to inventory'}
                                    </p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors">
                                <X size={16} />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-6">
                            <div className="grid grid-cols-2 gap-4">
                                {fields.map(field => (
                                    <div key={field.key} className={field.colSpan === 2 ? 'col-span-2' : ''}>
                                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                            {field.label}
                                        </label>
                                        <input
                                            type={field.type}
                                            required={field.required}
                                            className="input-field text-sm"
                                            value={formData[field.key]}
                                            onChange={e => setFormData(prev => ({ ...prev, [field.key]: e.target.value }))}
                                        />
                                    </div>
                                ))}

                                {/* Supplier select */}
                                <div className="col-span-2">
                                    <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                                        Supplier
                                    </label>
                                    <select
                                        className="input-field text-sm appearance-none"
                                        value={formData.supplier}
                                        onChange={e => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
                                    >
                                        <option value="">Select supplier...</option>
                                        {suppliers.map(s => (
                                            <option key={s._id} value={s._id}>{s.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-3 rounded-xl font-semibold text-slate-400 bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <RefreshCw size={16} className="animate-spin" />
                                    ) : (
                                        <>{editProduct ? 'Update' : 'Create'} Product</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

// ─── Main Inventory Page ──────────────────────────────────────────────────────
const Inventory = () => {
    const [products, setProducts] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [sortBy, setSortBy] = useState('name');
    const [sortDir, setSortDir] = useState('asc');
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editProduct, setEditProduct] = useState(null);
    const { user } = useAuth();
    const { socket } = useSocket();

    useEffect(() => {
        loadData();
    }, []);

    // Listen for realtime inventory updates
    useEffect(() => {
        if (!socket) return;
        const handler = (data) => {
            setProducts(prev => prev.map(p =>
                p._id === data.productId
                    ? { ...p, stockQuantity: data.newStock }
                    : p
            ));
        };
        socket.on('inventory:updated', handler);
        return () => socket.off('inventory:updated', handler);
    }, [socket]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [prodRes, supRes] = await Promise.all([
                axios.get('/api/inventory/products'),
                axios.get('/api/analytics/suppliers'),
            ]);
            if (prodRes.data.success) setProducts(prodRes.data.data);
            if (supRes.data.success) setSuppliers(supRes.data.data);
        } catch (err) {
            toast.error('Failed to load inventory');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id, name) => {
        if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
        try {
            await axios.delete(`/api/inventory/products/${id}`);
            toast.success('Product deleted');
            setProducts(prev => prev.filter(p => p._id !== id));
        } catch (err) {
            toast.error('Failed to delete product');
        }
    };

    // Categories for filter
    const categories = useMemo(() => {
        const cats = [...new Set(products.map(p => p.category))];
        return cats;
    }, [products]);

    // Filtered + sorted products
    const filtered = useMemo(() => {
        let result = products.filter(p => {
            const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.sku.toLowerCase().includes(searchTerm.toLowerCase());
            const matchCat = filterCategory === 'all' || p.category === filterCategory;
            const matchStatus = filterStatus === 'all' ||
                (filterStatus === 'out' && p.stockQuantity === 0) ||
                (filterStatus === 'low' && p.stockQuantity > 0 && p.stockQuantity <= p.reorderThreshold) ||
                (filterStatus === 'in' && p.stockQuantity > p.reorderThreshold);
            return matchSearch && matchCat && matchStatus;
        });

        result.sort((a, b) => {
            let aVal = a[sortBy], bVal = b[sortBy];
            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();
            return sortDir === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
        });

        return result;
    }, [products, searchTerm, filterCategory, filterStatus, sortBy, sortDir]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    const toggleSort = (field) => {
        if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortDir('asc'); }
    };

    return (
        <div className="space-y-5">
            {/* ─── Header ─────────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Inventory</h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        {products.length} products · {products.filter(p => p.stockQuantity <= p.reorderThreshold).length} need attention
                    </p>
                </div>
                {user?.role === 'admin' && (
                    <button
                        onClick={() => { setEditProduct(null); setShowModal(true); }}
                        className="btn-primary flex items-center gap-2"
                    >
                        <Plus size={16} /> Add Product
                    </button>
                )}
            </motion.div>

            {/* ─── Summary Cards ──────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                    { label: 'Total Products', value: products.length, icon: Layers, color: 'text-blue-400' },
                    { label: 'In Stock', value: products.filter(p => p.stockQuantity > p.reorderThreshold).length, icon: CheckCircle, color: 'text-emerald-400' },
                    { label: 'Low Stock', value: products.filter(p => p.stockQuantity > 0 && p.stockQuantity <= p.reorderThreshold).length, icon: TrendingDown, color: 'text-amber-400' },
                    { label: 'Out of Stock', value: products.filter(p => p.stockQuantity === 0).length, icon: AlertCircle, color: 'text-rose-400' },
                ].map((item, i) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass rounded-xl border border-white/[0.06] p-4 flex items-center gap-3"
                    >
                        <item.icon size={18} className={item.color} />
                        <div>
                            <p className="text-lg font-black text-white">{item.value}</p>
                            <p className="text-xs text-slate-500">{item.label}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ─── Table Card ─────────────────────────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="glass rounded-2xl border border-white/[0.06] overflow-hidden"
            >
                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 p-4 border-b border-white/[0.06]">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                        <input
                            type="text"
                            placeholder="Search products or SKU..."
                            className="input-field pl-9 text-sm py-2"
                            value={searchTerm}
                            onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        />
                    </div>

                    {/* Category filter */}
                    <select
                        className="input-field text-sm py-2 w-auto min-w-[130px] appearance-none"
                        value={filterCategory}
                        onChange={e => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* Status filter */}
                    <select
                        className="input-field text-sm py-2 w-auto min-w-[120px] appearance-none"
                        value={filterStatus}
                        onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
                    >
                        <option value="all">All Status</option>
                        <option value="in">In Stock</option>
                        <option value="low">Low Stock</option>
                        <option value="out">Out of Stock</option>
                    </select>

                    <button
                        onClick={loadData}
                        className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                    >
                        <RefreshCw size={14} />
                    </button>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>
                                    <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-white transition-colors">
                                        Product <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>Category</th>
                                <th>
                                    <button onClick={() => toggleSort('price')} className="flex items-center gap-1 hover:text-white transition-colors">
                                        Price <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>Cost</th>
                                <th>
                                    <button onClick={() => toggleSort('stockQuantity')} className="flex items-center gap-1 hover:text-white transition-colors">
                                        Stock <ArrowUpDown size={10} />
                                    </button>
                                </th>
                                <th>Status</th>
                                <th>Supplier</th>
                                {user?.role === 'admin' && <th className="text-right">Actions</th>}
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
                            ) : paginated.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center">
                                        <Package size={32} className="text-slate-700 mx-auto mb-3" />
                                        <p className="text-slate-500 text-sm">No products found</p>
                                    </td>
                                </tr>
                            ) : paginated.map((p, i) => (
                                <motion.tr
                                    key={p._id}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.03 }}
                                    className="group"
                                >
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/20 transition-colors">
                                                <Package size={14} className="text-slate-500 group-hover:text-blue-400 transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-white">{p.name}</p>
                                                <p className="text-[10px] text-slate-600 font-mono">{p.sku}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <span className="badge badge-blue text-[10px]">
                                            <Tag size={9} /> {p.category}
                                        </span>
                                    </td>
                                    <td>
                                        <span className="text-sm font-bold text-white">${p.price.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <span className="text-sm text-slate-500">${p.costPrice.toLocaleString()}</span>
                                    </td>
                                    <td>
                                        <div className="space-y-1.5">
                                            <span className="text-sm font-bold text-white">{p.stockQuantity}</span>
                                            <StockBar quantity={p.stockQuantity} threshold={p.reorderThreshold} />
                                        </div>
                                    </td>
                                    <td>
                                        <StatusBadge quantity={p.stockQuantity} threshold={p.reorderThreshold} />
                                    </td>
                                    <td>
                                        <span className="text-xs text-slate-500">{p.supplier?.name || '—'}</span>
                                    </td>
                                    {user?.role === 'admin' && (
                                        <td className="text-right">
                                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => { setEditProduct(p); setShowModal(true); }}
                                                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-blue-400 hover:border-blue-500/20 transition-all"
                                                >
                                                    <Edit2 size={13} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(p._id, p.name)}
                                                    className="p-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-500 hover:text-rose-400 hover:border-rose-500/20 transition-all"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-white/[0.06]">
                    <p className="text-xs text-slate-500">
                        Showing {Math.min(filtered.length, (currentPage - 1) * ITEMS_PER_PAGE + 1)}–{Math.min(filtered.length, currentPage * ITEMS_PER_PAGE)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-30"
                        >
                            <ChevronLeft size={14} />
                        </button>
                        {[...Array(totalPages)].map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-7 h-7 rounded-lg text-xs font-semibold transition-all ${
                                    currentPage === i + 1
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-500 hover:text-white hover:bg-white/[0.06]'
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg border border-white/[0.06] text-slate-500 hover:text-white hover:border-white/[0.12] transition-all disabled:opacity-30"
                        >
                            <ChevronRight size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Modal */}
            <ProductModal
                isOpen={showModal}
                onClose={() => { setShowModal(false); setEditProduct(null); }}
                onSuccess={loadData}
                suppliers={suppliers}
                editProduct={editProduct}
            />
        </div>
    );
};

export default Inventory;
