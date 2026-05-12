import { useState, useRef } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Package,
    ShoppingCart,
    BarChart3,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronDown,
    Sparkles,
    Wifi,
    WifiOff,
    Zap,
    Settings,
    HelpCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationCenter from '../ui/NotificationCenter';
import AIAssistant from '../ui/AIAssistant';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/', description: 'Overview & KPIs' },
    { icon: Package, label: 'Inventory', path: '/inventory', description: 'Products & Stock' },
    { icon: ShoppingCart, label: 'Sales', path: '/sales', description: 'Transactions' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics', roles: ['admin'], description: 'Business Intelligence' },
];

const SidebarItem = ({ icon: Icon, label, path, roles, description, isCollapsed }) => {
    const { user } = useAuth();
    if (roles && !roles.includes(user?.role)) return null;

    return (
        <NavLink
            to={path}
            className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative
                ${isActive
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/20'
                    : 'text-slate-500 hover:bg-white/[0.05] hover:text-slate-200'
                }
                ${isCollapsed ? 'justify-center' : ''}
            `}
        >
            {({ isActive }) => (
                <>
                    {isActive && (
                        <motion.div
                            layoutId="activeNav"
                            className="absolute inset-0 rounded-xl bg-blue-600/10 border border-blue-500/20"
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        />
                    )}
                    <Icon
                        size={18}
                        className={`relative z-10 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`}
                    />
                    {!isCollapsed && (
                        <div className="relative z-10 min-w-0">
                            <p className="text-sm font-medium leading-none">{label}</p>
                            <p className="text-[10px] text-slate-600 mt-0.5 group-hover:text-slate-500 transition-colors">{description}</p>
                        </div>
                    )}
                    {isCollapsed && (
                        <div className="absolute left-full ml-3 px-3 py-2 bg-surface-2 border border-white/[0.08] rounded-xl text-sm font-medium text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-xl">
                            {label}
                        </div>
                    )}
                </>
            )}
        </NavLink>
    );
};

const MainLayout = ({ children }) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [isNotifOpen, setIsNotifOpen] = useState(false);
    const [isAIOpen, setIsAIOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user, logout } = useAuth();
    const { isConnected, notifications, dismissNotification, clearAllNotifications } = useSocket();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const pageTitle = {
        '/': 'Dashboard',
        '/inventory': 'Inventory',
        '/sales': 'Sales',
        '/analytics': 'Analytics',
    }[location.pathname] || 'SmartStock';

    return (
        <div className="min-h-screen bg-surface-0 flex overflow-hidden">
            {/* ─── Sidebar ─────────────────────────────────────────────────────── */}
            <motion.aside
                animate={{ width: isSidebarCollapsed ? 72 : 240 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="flex-shrink-0 flex flex-col border-r border-white/[0.06] bg-surface-1 relative z-50 overflow-hidden"
            >
                {/* Logo */}
                <div className={`flex items-center gap-3 p-4 h-16 border-b border-white/[0.06] ${isSidebarCollapsed ? 'justify-center' : ''}`}>
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center flex-shrink-0 shadow-glow-blue">
                        <Zap size={16} className="text-white" />
                    </div>
                    <AnimatePresence>
                        {!isSidebarCollapsed && (
                            <motion.div
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                className="overflow-hidden"
                            >
                                <span className="font-black text-white text-base tracking-tight whitespace-nowrap">SmartStock</span>
                                <span className="text-blue-400 text-[10px] font-bold ml-1.5 bg-blue-500/10 px-1.5 py-0.5 rounded-md">AI</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Nav */}
                <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                    {navItems.map(item => (
                        <SidebarItem
                            key={item.path}
                            {...item}
                            isCollapsed={isSidebarCollapsed}
                        />
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="p-3 border-t border-white/[0.06] space-y-1">
                    {/* AI Assistant button */}
                    <button
                        onClick={() => setIsAIOpen(true)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-500 hover:bg-white/[0.05] hover:text-violet-400 transition-all group ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <Sparkles size={18} className="flex-shrink-0 group-hover:scale-110 transition-transform" />
                        {!isSidebarCollapsed && (
                            <div className="text-left">
                                <p className="text-sm font-medium">AI Assistant</p>
                                <p className="text-[10px] text-slate-600">Business insights</p>
                            </div>
                        )}
                    </button>

                    {/* User info */}
                    {!isSidebarCollapsed && (
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                            <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0 bg-slate-700">
                                {user?.picture
                                    ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{user?.name?.charAt(0)}</div>
                                }
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-semibold text-slate-300 truncate">{user?.name}</p>
                                <p className="text-[10px] text-slate-600 capitalize">{user?.role}</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.aside>

            {/* ─── Main Content ─────────────────────────────────────────────────── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <header className="h-16 flex-shrink-0 flex items-center justify-between px-6 border-b border-white/[0.06] bg-surface-1/50 backdrop-blur-xl sticky top-0 z-40">
                    {/* Left: Toggle + Breadcrumb */}
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                        <div>
                            <h1 className="text-sm font-bold text-white">{pageTitle}</h1>
                            <p className="text-[10px] text-slate-600">SmartStock AI Platform</p>
                        </div>
                    </div>

                    {/* Center: Search */}
                    <div className="flex-1 max-w-sm mx-6 hidden md:block">
                        <div className="relative group">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-blue-400 transition-colors" />
                            <input
                                type="text"
                                placeholder="Search products, sales..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-300 placeholder-slate-600 outline-none focus:border-blue-500/30 focus:bg-white/[0.06] transition-all"
                            />
                            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-700 bg-white/[0.04] px-1.5 py-0.5 rounded border border-white/[0.06] hidden group-focus-within:hidden">⌘K</kbd>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                        {/* Connection status */}
                        <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                            isConnected
                                ? 'text-emerald-400 bg-emerald-500/10'
                                : 'text-slate-600 bg-white/[0.04]'
                        }`}>
                            {isConnected
                                ? <><Wifi size={12} /> Live</>
                                : <><WifiOff size={12} /> Offline</>
                            }
                        </div>

                        {/* AI Button */}
                        <button
                            onClick={() => setIsAIOpen(true)}
                            className="p-2 rounded-xl hover:bg-violet-500/10 text-slate-500 hover:text-violet-400 transition-colors"
                            title="AI Assistant"
                        >
                            <Sparkles size={18} />
                        </button>

                        {/* Notifications */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsNotifOpen(!isNotifOpen); setIsProfileOpen(false); }}
                                className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors relative"
                            >
                                <Bell size={18} />
                                {notifications.length > 0 && (
                                    <motion.span
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="absolute top-1.5 right-1.5 w-2 h-2 bg-blue-500 rounded-full border border-surface-1"
                                    />
                                )}
                            </button>
                            <NotificationCenter
                                notifications={notifications}
                                onDismiss={dismissNotification}
                                onClearAll={clearAllNotifications}
                                isOpen={isNotifOpen}
                                onClose={() => setIsNotifOpen(false)}
                            />
                        </div>

                        {/* Profile */}
                        <div className="relative">
                            <button
                                onClick={() => { setIsProfileOpen(!isProfileOpen); setIsNotifOpen(false); }}
                                className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-white/[0.06] transition-colors"
                            >
                                <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-700 flex-shrink-0">
                                    {user?.picture
                                        ? <img src={user.picture} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{user?.name?.charAt(0)}</div>
                                    }
                                </div>
                                <span className="text-sm font-medium text-slate-300 hidden sm:block">{user?.name?.split(' ')[0]}</span>
                                <ChevronDown size={14} className={`text-slate-600 transition-transform ${isProfileOpen ? 'rotate-180' : ''}`} />
                            </button>

                            <AnimatePresence>
                                {isProfileOpen && (
                                    <>
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[80]"
                                            onClick={() => setIsProfileOpen(false)}
                                        />
                                        <motion.div
                                            initial={{ opacity: 0, y: -8, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: -8, scale: 0.95 }}
                                            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                                            className="absolute right-0 top-full mt-2 w-52 glass rounded-2xl border border-white/[0.1] shadow-2xl py-2 z-[90] overflow-hidden"
                                        >
                                            <div className="px-4 py-3 border-b border-white/[0.06]">
                                                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 text-[10px] font-bold uppercase tracking-wider">{user?.role}</span>
                                            </div>
                                            <div className="py-1">
                                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2.5">
                                                    <Settings size={14} /> Settings
                                                </button>
                                                <button className="w-full text-left px-4 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors flex items-center gap-2.5">
                                                    <HelpCircle size={14} /> Help & Support
                                                </button>
                                                <div className="my-1 border-t border-white/[0.06]" />
                                                <button
                                                    onClick={handleLogout}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center gap-2.5 font-medium"
                                                >
                                                    <LogOut size={14} /> Sign Out
                                                </button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <motion.div
                        key={location.pathname}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="p-6 pb-12 max-w-[1600px] mx-auto"
                    >
                        {children}
                    </motion.div>
                </main>
            </div>

            {/* AI Assistant Panel */}
            <AIAssistant isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
        </div>
    );
};

export default MainLayout;
