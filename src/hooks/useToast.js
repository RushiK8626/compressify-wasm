import { useState } from "react";

export function useToast() {
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const showToast = (severity, message) => {
        setToast({
            open: true,
            severity,
            message,
        });
    };

    const handleClose = () => {
        setToast(prev => ({ ...prev, open: false }));
    };

    return {toast, showToast, handleClose}
}