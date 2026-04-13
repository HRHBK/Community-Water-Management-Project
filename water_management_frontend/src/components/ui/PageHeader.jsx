import { motion } from 'framer-motion';

export default function PageHeader({ title, description, action }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10"
        >
            <div className="space-y-1">
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-1 rounded-full bg-navy-950 dark:bg-gold-500" />
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-400">AquaCam Overview</p>
                </div>
                <h2 className="text-3xl font-black tracking-tighter text-navy-950 dark:text-white sm:text-4xl">
                    {title}
                </h2>
                {description && (
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-2xl">
                        {description}
                    </p>
                )}
            </div>
            {action && (
                <div className="shrink-0 flex items-center">
                    {action}
                </div>
            )}
        </motion.div>
    );
}