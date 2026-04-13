import { Menu, Sun, Moon, Bell, Search } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

export default function Header({ onMenuClick, title }) {
    const { dark, toggle } = useTheme();
    const { user } = useAuth();

    return (
        <header className="sticky top-0 z-30
                        bg-white/60 dark:bg-[#050816]/70
                        backdrop-blur-2xl
                        border-b border-white dark:border-white/5
                        px-4 md:px-6 py-3 md:py-4 flex items-center justify-between transition-all duration-300">
            <div className="flex items-center gap-3 md:gap-6">
                <button
                    onClick={onMenuClick}
                    className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 group active:scale-95"
                    aria-label="Toggle Menu"
                >
                    <Menu size={18} className="text-slate-600 dark:text-slate-100 group-hover:text-navy-900 dark:group-hover:text-gold-400 transition-colors" />
                </button>
                
                {/* Responsive Search - Hidden on small mobile */}
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent focus-within:border-navy-900/10 dark:focus-within:border-gold-500/20 focus-within:bg-white dark:focus-within:bg-black/20 transition-all duration-300 w-48 md:w-64 lg:w-96 group">
                   <Search size={16} className="text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                   <input 
                    type="text" 
                    placeholder="Quick search..." 
                    className="bg-transparent border-none focus:ring-0 text-sm font-bold text-slate-800 dark:text-slate-100 placeholder-slate-400 w-full"
                   />
                </div>

                <h1 className="text-[10px] md:text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-100 hidden lg:block opacity-60">
                    {title}
                </h1>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                {/* Theme toggle */}
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={toggle}
                    className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300"
                >
                    {dark
                        ? <Sun size={18} className="text-gold-400" />
                        : <Moon size={18} className="text-slate-600" />
                    }
                </motion.button>

                {/* Notifications */}
                <button className="p-2 md:p-2.5 rounded-xl md:rounded-2xl bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/10 transition-all duration-300 relative group">
                    <Bell size={18} className="text-slate-600 dark:text-slate-100 group-hover:text-navy-900 dark:group-hover:text-gold-400 transition-colors" />
                    <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#050816] animate-pulse" />
                </button>

                {/* Divider */}
                <div className="w-px h-6 md:h-8 bg-slate-200 dark:bg-white/10 mx-1 hidden xs:block" />

                {/* User Section - Minimal on mobile */}
                <div className="flex items-center gap-2 md:gap-3 pl-1">
                    <div className="text-right hidden sm:block">
                        <p className="text-[12px] md:text-[13px] font-black text-slate-900 dark:text-white leading-none mb-1">
                            {user?.username}
                        </p>
                        <p className="text-[9px] md:text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black leading-none">
                            {user?.role?.replace('_', ' ')}
                        </p>
                    </div>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-br from-navy-900 to-black dark:from-gold-400 dark:to-gold-600 p-0.5 shadow-xl">
                        <div className="w-full h-full rounded-[10px] md:rounded-[14px] bg-white dark:bg-navy-950 flex items-center justify-center">
                            <span className="text-[12px] md:text-[14px] font-black text-navy-900 dark:text-gold-500">
                                {user?.username?.charAt(0).toUpperCase()}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}