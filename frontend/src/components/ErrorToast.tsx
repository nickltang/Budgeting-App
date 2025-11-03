import { useEffect } from 'react';

interface ErrorToastProps {
  message: string;
  onClose: () => void;
  duration?: number;
}

export function ErrorToast({ message, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-100 text-red-600 p-4 rounded-xl shadow-lg z-50 max-w-md">
      <div className="flex justify-between items-center">
        <p className="font-medium">{message}</p>
        <button
          onClick={onClose}
          className="ml-4 text-red-600 hover:text-red-800"
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
}

