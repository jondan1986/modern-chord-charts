import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                ref={overlayRef}
                className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg shadow-xl w-full max-w-md transform transition-all"
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}
