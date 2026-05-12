import { useEffect, useRef, useState } from 'react';

/**
 * Animated number counter that counts up from 0 to the target value.
 */
const AnimatedCounter = ({ value, prefix = '', suffix = '', decimals = 0, duration = 1500 }) => {
    const [displayValue, setDisplayValue] = useState(0);
    const startTimeRef = useRef(null);
    const frameRef = useRef(null);
    const startValueRef = useRef(0);

    useEffect(() => {
        const target = parseFloat(value) || 0;
        const start = startValueRef.current;

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);

            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = start + (target - start) * eased;

            setDisplayValue(current);

            if (progress < 1) {
                frameRef.current = requestAnimationFrame(animate);
            } else {
                startValueRef.current = target;
            }
        };

        startTimeRef.current = null;
        frameRef.current = requestAnimationFrame(animate);

        return () => {
            if (frameRef.current) cancelAnimationFrame(frameRef.current);
        };
    }, [value, duration]);

    const formatted = displayValue.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

    return (
        <span>
            {prefix}{formatted}{suffix}
        </span>
    );
};

export default AnimatedCounter;
