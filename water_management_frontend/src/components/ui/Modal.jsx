import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    const sizes = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl',
    };

    return (
        <AnimatePresence>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/50"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className={`relative w-full ${sizes[size]} card shadow-2xl max-h-[90vh] flex flex-col`}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-navy-700">
                            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1 px-6 py-5">
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}