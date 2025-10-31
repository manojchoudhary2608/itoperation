
import React, { useEffect, useRef } from 'react';

const InactivityLogout = ({ children, logout }) => {
    const timer = useRef(null);

    const resetTimer = () => {
        if (timer.current) {
            clearTimeout(timer.current);
        }
        timer.current = setTimeout(() => {
            logout();
        }, 15 * 60 * 1000); // 15 minutes
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'mousedown', 'scroll'];

        const eventHandler = () => {
            resetTimer();
        };

        events.forEach(event => {
            window.addEventListener(event, eventHandler);
        });

        resetTimer(); // Initial timer start

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, eventHandler);
            });
            if (timer.current) {
                clearTimeout(timer.current);
            }
        };
    }, [logout]);

    return <>{children}</>;
};

export default InactivityLogout;
