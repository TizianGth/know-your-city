import React, { useEffect, useRef } from 'react';
import './ErrorPopup.css';

const ErrorPopup = ({ message, onClose }) => {
    console.log(message)
    const popupRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (popupRef.current && !popupRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!message) return null;

    return (
        <div className="error-popup">
            <div className="error-popup-content" ref={popupRef}>
                <p>{message}</p>
            </div>
        </div>
    );
};

export default ErrorPopup;
