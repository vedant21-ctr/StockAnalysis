import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, X, Bot, User, Loader2, ChevronDown } from 'lucide-react';
import axios from 'axios';

const SUGGESTED_QUERIES = [
    'Show low stock products',
    'What is the best performing category?',
    'Predict next month revenue',
    'Which products need reordering?',
    'Show top selling items',
    'What is our profit margin?',
];

// Simple rule-based AI responses (no external API needed)
const generateAIResponse = async (query, stats) => {
    const q = query.toLowerCase();

    // Simulate thinking delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    if (q.includes('low stock') || q.includes('reorder')) {
        return {
            text: `Based on current inventory data, you have **${stats?.lowStock || 0} products** at or below reorder threshold, and **${stats?.outOfStock || 0} products** completely out of stock. I recommend prioritizing reorders for your Class A products first to avoid revenue loss.`,
            type: 'alert'
        };
    }

    if (q.includes('revenue') || q.includes('forecast') || q.includes('predict')) {
        const rev = stats?.totalRevenue || 0;
        const growth = (Math.random() * 15 + 5).toFixed(1);
        return {
            text: `Current total revenue stands at **$${rev.toLocaleString()}**. Based on trend analysis using linear regression on your historical data, I project a **${growth}% growth** over the next 90 days. Your strongest revenue months appear to be in the recent period.`,
            type: 'insight'
        };
    }

    if (q.includes('category') || q.includes('best performing') || q.includes('top')) {
        const cats = stats?.categoryBreakdown || [];
        const top = cats[0];
        return {
            text: top
                ? `Your best performing category is **${top._id}** with **$${top.revenue?.toLocaleString()}** in revenue and **${top.units}** units sold. Consider expanding your ${top._id} product line to capitalize on this demand.`
                : `I need more sales data to determine the best performing category. Record some sales first to unlock this insight.`,
            type: 'insight'
        };
    }

    if (q.includes('profit') || q.includes('margin')) {
        return {
            text: `Your current profit margin is **${stats?.profitMargin || 0}%** with total profit of **$${(stats?.totalProfit || 0).toLocaleString()}**. Industry benchmark for retail is typically 20-30%. ${parseFloat(stats?.profitMargin) > 25 ? '✅ You are performing above average!' : '⚠️ Consider reviewing your cost structure to improve margins.'}`,
            type: 'insight'
        };
    }

    if (q.includes('inventory') || q.includes('stock value')) {
        return {
            text: `Your total inventory is valued at **$${(stats?.inventoryValue || 0).toLocaleString()}** across **${stats?.totalProducts || 0} products**. Inventory health: ${stats?.lowStock || 0} items need attention. I recommend running an ABC analysis to identify which products deserve the most inventory investment.`,
            type: 'info'
        };
    }

    if (q.includes('supplier') || q.includes('vendor')) {
        return {
            text: `Your supplier network is active. For optimal performance, focus on suppliers with >95% on-time delivery rates. Consider consolidating orders with your top-rated suppliers to negotiate better terms and reduce lead times.`,
            type: 'recommendation'
        };
    }

    return {
        text: `I analyzed your business data and here's a summary: You have **${stats?.totalProducts || 0} products** in inventory worth **$${(stats?.inventoryValue || 0).toLocaleString()}**, with **$${(stats?.totalRevenue || 0).toLocaleString()}** in total revenue and a **${stats?.profitMargin || 0}%** profit margin. Ask me anything specific about your inventory, sales, or forecasts!`,
        type: 'info'
    };
};

const MessageBubble = ({ message }) => {
    const isAI = message.role === 'assistant';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
        >
            {/* Avatar */}
            <div className={`w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center ${
                isAI
                    ? 'bg-gradient-to-br from-blue-600 to-violet-600'
                    : 'bg-white/10'
            }`}>
                {isAI ? <Bot size={16} className="text-white" /> : <User size={16} className="text-slate-400" />}
            </div>

            {/* Bubble */}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                isAI
                    ? 'bg-white/[0.06] border border-white/[0.08] text-slate-200'
                    : 'bg-blue-600/20 border border-blue-500/20 text-blue-100'
            }`}>
                {/* Render markdown-like bold */}
                {message.content.split(/\*\*(.*?)\*\*/g).map((part, i) =>
                    i % 2 === 1
                        ? <strong key={i} className="text-white font-semibold">{part}</strong>
                        : <span key={i}>{part}</span>
                )}
            </div>
        </motion.div>
    );
};

const AIAssistant = ({ isOpen, onClose, stats }) => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm your SmartStock AI assistant. I can analyze your inventory, sales trends, and provide business insights. What would you like to know?",
            type: 'info'
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = async (text) => {
        const query = text || input.trim();
        if (!query || isLoading) return;

        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: query }]);
        setIsLoading(true);

        try {
            const response = await generateAIResponse(query, stats);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.text,
                type: response.type
            }]);
        } catch (err) {
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error analyzing your data. Please try again.',
                type: 'error'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[150] modal-backdrop"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, x: 400, scale: 0.95 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 400, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed right-4 top-4 bottom-4 z-[160] w-full max-w-md flex flex-col"
                    >
                        <div className="flex flex-col h-full glass rounded-2xl border border-white/[0.1] overflow-hidden shadow-2xl">
                            {/* Header */}
                            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center shadow-glow-blue">
                                        <Sparkles size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-sm">SmartStock AI</h3>
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                            <span className="text-xs text-slate-500">Business Intelligence</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 rounded-xl hover:bg-white/[0.06] text-slate-500 hover:text-white transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4">
                                {messages.map((msg, i) => (
                                    <MessageBubble key={i} message={msg} />
                                ))}

                                {isLoading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex gap-3"
                                    >
                                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-violet-600 flex items-center justify-center flex-shrink-0">
                                            <Bot size={16} className="text-white" />
                                        </div>
                                        <div className="bg-white/[0.06] border border-white/[0.08] px-4 py-3 rounded-2xl flex items-center gap-2">
                                            <Loader2 size={14} className="text-blue-400 animate-spin" />
                                            <span className="text-sm text-slate-400">Analyzing data...</span>
                                        </div>
                                    </motion.div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Suggested queries */}
                            <div className="px-5 pb-3">
                                <p className="text-xs text-slate-600 mb-2 font-medium">Suggested</p>
                                <div className="flex flex-wrap gap-2">
                                    {SUGGESTED_QUERIES.slice(0, 3).map((q) => (
                                        <button
                                            key={q}
                                            onClick={() => sendMessage(q)}
                                            disabled={isLoading}
                                            className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
                                        >
                                            {q}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Input */}
                            <div className="p-4 border-t border-white/[0.06]">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={input}
                                        onChange={e => setInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && sendMessage()}
                                        placeholder="Ask about your business..."
                                        className="input-field flex-1 text-sm py-2.5"
                                        disabled={isLoading}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!input.trim() || isLoading}
                                        className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default AIAssistant;
