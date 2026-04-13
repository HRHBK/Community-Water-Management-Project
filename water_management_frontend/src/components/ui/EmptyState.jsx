import { motion } from 'framer-motion';

export default function EmptyState({ icon: Icon, title, description, action }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 px-6 text-center"
        >
            <div className="relative mb-8">
                {/* Decorative background glow */}
                <div className="absolute inset-0 bg-navy-900/5 dark:bg-gold-500/10 rounded-full blur-2xl scale-150" />
                
                <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative w-24 h-24 rounded-[2rem] bg-white dark:bg-navy-900 shadow-2xl flex items-center justify-center border border-white dark:border-white/10"
                >
                    {Icon && <Icon size={40} className="text-navy-950/20 dark:text-gold-500/30" />}
                </motion.div>
                
                {/* Floating particles */}
                <motion.div 
                    animate={{ x: [0, 10, 0], y: [0, 15, 0] }}
                    transition={{ duration: 5, repeat: Infinity }}
                    className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-gold-400 opacity-40 blur-sm" 
                />
                <motion.div 
                    animate={{ x: [0, -15, 0], y: [0, -10, 0] }}
                    transition={{ duration: 6, repeat: Infinity }}
                    className="absolute -bottom-4 -left-4 w-6 h-6 rounded-full bg-navy-900/10 dark:bg-gold-500/10 blur-md text-navy-400" 
                />
            </div>
            
            <h3 className="text-xl font-black text-navy-950 dark:text-white mb-2">
                {title}
            </h3>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 max-w-sm leading-relaxed">
                {description}
            </p>
            {action && (
                <div className="transform hover:scale-105 transition-transform duration-300">
                    {action}
                </div>
            )}
        </motion.div>
    );
}