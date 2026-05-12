import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion } from 'framer-motion';
import {
    Zap, ShieldCheck, BarChart3, Package,
    TrendingUp, Sparkles, ArrowRight, Activity
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Animated feature pill ────────────────────────────────────────────────────
const FeaturePill = ({ icon: Icon, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08] backdrop-blur-sm"
    >
        <Icon size={14} className="text-blue-400 flex-shrink-0" />
        <span className="text-sm text-slate-300 font-medium">{label}</span>
    </motion.div>
);

// ─── Animated stat ────────────────────────────────────────────────────────────
const AnimatedStat = ({ value, label, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="text-center"
    >
        <p className="text-2xl font-black text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </motion.div>
);

const Login = () => {
    const [loading, setLoading] = useState(false);
    const { googleLogin } = useAuth();
    const navigate = useNavigate();

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const result = await googleLogin(credentialResponse.credential);
            if (result.success) {
                toast.success('Welcome to SmartStock AI!');
                navigate('/');
            } else {
                toast.error(result.message || 'Login failed');
            }
        } catch (err) {
            toast.error('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-surface-0 flex overflow-hidden relative">
            {/* Background effects */}
            <div className="absolute inset-0 grid-bg opacity-50" />
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-violet-600/8 rounded-full blur-3xl" />

            {/* ─── Left Panel ─────────────────────────────────────────────────── */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10">
                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center shadow-glow-blue">
                        <Zap size={20} className="text-white" />
                    </div>
                    <div>
                        <span className="text-xl font-black text-white tracking-tight">SmartStock</span>
                        <span className="text-blue-400 text-xs font-bold ml-2 bg-blue-500/10 px-1.5 py-0.5 rounded-md">AI</span>
                    </div>
                </motion.div>

                {/* Main copy */}
                <div className="space-y-8">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-xs text-emerald-400 font-semibold uppercase tracking-widest">Live Platform</span>
                        </div>
                        <h1 className="text-5xl font-black text-white leading-tight tracking-tight">
                            Intelligent<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-400">
                                Inventory
                            </span><br />
                            Management
                        </h1>
                        <p className="text-slate-400 mt-5 text-lg leading-relaxed max-w-sm">
                            AI-powered business intelligence with real-time analytics, forecasting, and smart insights.
                        </p>
                    </motion.div>

                    {/* Feature pills */}
                    <div className="flex flex-wrap gap-2">
                        <FeaturePill icon={BarChart3} label="Advanced Analytics" delay={0.4} />
                        <FeaturePill icon={Activity} label="Real-time Updates" delay={0.5} />
                        <FeaturePill icon={TrendingUp} label="AI Forecasting" delay={0.6} />
                        <FeaturePill icon={Package} label="Smart Inventory" delay={0.7} />
                        <FeaturePill icon={Sparkles} label="AI Assistant" delay={0.8} />
                    </div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.9 }}
                        className="flex items-center gap-8 pt-4 border-t border-white/[0.06]"
                    >
                        <AnimatedStat value="99.9%" label="Uptime" delay={1.0} />
                        <AnimatedStat value="<50ms" label="Response Time" delay={1.1} />
                        <AnimatedStat value="256-bit" label="Encryption" delay={1.2} />
                    </motion.div>
                </div>

                {/* Footer */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.3 }}
                    className="text-xs text-slate-600"
                >
                    Enterprise-grade security · Google OAuth 2.0 · JWT Authentication
                </motion.p>
            </div>

            {/* ─── Right Panel (Login Form) ────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center p-8 relative z-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="w-full max-w-sm"
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-3 mb-10 lg:hidden">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center">
                            <Zap size={18} className="text-white" />
                        </div>
                        <span className="text-lg font-black text-white">SmartStock AI</span>
                    </div>

                    {/* Card */}
                    <div className="glass rounded-2xl border border-white/[0.1] p-8 shadow-2xl">
                        {/* Icon */}
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6">
                            <ShieldCheck size={28} className="text-blue-400" />
                        </div>

                        <h2 className="text-2xl font-black text-white text-center mb-2">
                            Welcome Back
                        </h2>
                        <p className="text-slate-500 text-sm text-center mb-8">
                            Sign in with your Google account to access the platform
                        </p>

                        {/* Google Login */}
                        <div className="flex flex-col items-center gap-4">
                            {loading ? (
                                <div className="w-full h-12 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center">
                                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                                </div>
                            ) : (
                                <div className="w-full">
                                    <GoogleLogin
                                        onSuccess={handleGoogleSuccess}
                                        onError={() => toast.error('Google Login Failed')}
                                        useOneTap
                                        theme="filled_blue"
                                        size="large"
                                        shape="rectangular"
                                        width="100%"
                                    />
                                </div>
                            )}

                            <div className="flex items-center gap-3 w-full">
                                <div className="h-px bg-white/[0.06] flex-1" />
                                <span className="text-xs text-slate-600 font-medium">Secure Login</span>
                                <div className="h-px bg-white/[0.06] flex-1" />
                            </div>

                            <p className="text-xs text-slate-600 text-center leading-relaxed">
                                By signing in, you agree to our{' '}
                                <a href="#" className="text-blue-400 hover:underline">Terms of Service</a>
                                {' '}and{' '}
                                <a href="#" className="text-blue-400 hover:underline">Privacy Policy</a>
                            </p>
                        </div>
                    </div>

                    {/* Trust badges */}
                    <div className="flex items-center justify-center gap-6 mt-6">
                        {['SOC 2', 'GDPR', 'ISO 27001'].map(badge => (
                            <span key={badge} className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">
                                {badge}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

export default Login;
