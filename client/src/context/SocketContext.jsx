import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import { ShoppingCart, AlertTriangle } from 'lucide-react';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
    const socketRef = useRef(null);
    const [isConnected, setIsConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [liveSales, setLiveSales] = useState([]);

    useEffect(() => {
        // Connect to Socket.IO server
        socketRef.current = io(window.location.origin, {
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
        });

        const socket = socketRef.current;

        socket.on('connect', () => {
            setIsConnected(true);
            socket.emit('join:dashboard');
            socket.emit('join:inventory');
        });

        socket.on('disconnect', () => {
            setIsConnected(false);
        });

        // Live sale event
        socket.on('sale:new', (data) => {
            setLiveSales(prev => [data, ...prev].slice(0, 20));
            addNotification({
                id: data.id || Date.now(),
                type: 'sale',
                message: `New sale: ${data.productName} × ${data.quantity}`,
                amount: data.totalAmount,
                timestamp: data.timestamp
            });

            toast.success(
                `💰 Sale: ${data.productName} — $${data.totalAmount?.toLocaleString()}`,
                { duration: 3000 }
            );
        });

        // Low stock alert
        socket.on('alert:lowstock', (data) => {
            addNotification({
                id: Date.now(),
                type: 'alert',
                message: `Low stock: ${data.productName} (${data.currentStock} left)`,
                timestamp: data.timestamp
            });

            toast.error(
                `⚠️ Low Stock: ${data.productName} — only ${data.currentStock} remaining`,
                { duration: 5000 }
            );
        });

        // Activity feed (simulated)
        socket.on('activity:new', (data) => {
            addNotification({
                id: data.id,
                type: data.type,
                message: data.message,
                amount: data.amount,
                timestamp: data.timestamp
            });
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const addNotification = (notification) => {
        setNotifications(prev => [notification, ...prev].slice(0, 50));
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    return (
        <SocketContext.Provider value={{
            socket: socketRef.current,
            isConnected,
            notifications,
            liveSales,
            dismissNotification,
            clearAllNotifications,
            addNotification
        }}>
            {children}
        </SocketContext.Provider>
    );
};

export const useSocket = () => useContext(SocketContext);
