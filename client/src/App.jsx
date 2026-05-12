import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Layout & Pages
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/dashboard/Dashboard';
import Inventory from './pages/inventory/Inventory';
import Sales from './pages/sales/Sales';
import Analytics from './pages/analytics/Analytics';
import Login from './pages/auth/Login';

// ─── Loading Screen ───────────────────────────────────────────────────────────
const LoadingScreen = () => (
    <div className="min-h-screen bg-surface-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
            <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-glow-blue">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" />
                    </svg>
                </div>
                <div className="absolute inset-0 rounded-2xl bg-blue-500/20 animate-ping" />
            </div>
            <div className="w-40 h-0.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                    className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.2, ease: 'easeInOut', repeat: Infinity }}
                />
            </div>
            <p className="text-slate-600 text-xs font-medium tracking-widest uppercase">
                SmartStock AI
            </p>
        </div>
    </div>
);

// ─── Protected Route ──────────────────────────────────────────────────────────
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <LoadingScreen />;
    if (!user) return <Navigate to="/login" replace />;
    if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

    return (
        <SocketProvider>
            <MainLayout>{children}</MainLayout>
        </SocketProvider>
    );
};

// ─── App ──────────────────────────────────────────────────────────────────────
function App() {
    return (
        <Router>
            <AuthProvider>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        style: {
                            background: 'rgba(10, 15, 30, 0.95)',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            color: '#e2e8f0',
                            borderRadius: '12px',
                            backdropFilter: 'blur(20px)',
                            fontSize: '13px',
                            fontWeight: '500',
                        },
                        success: {
                            iconTheme: { primary: '#10b981', secondary: 'white' },
                        },
                        error: {
                            iconTheme: { primary: '#ef4444', secondary: 'white' },
                        },
                    }}
                />
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route path="/" element={
                        <ProtectedRoute>
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/inventory" element={
                        <ProtectedRoute>
                            <Inventory />
                        </ProtectedRoute>
                    } />

                    <Route path="/sales" element={
                        <ProtectedRoute>
                            <Sales />
                        </ProtectedRoute>
                    } />

                    <Route path="/analytics" element={
                        <ProtectedRoute roles={['admin']}>
                            <Analytics />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
