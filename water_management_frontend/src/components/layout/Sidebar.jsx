import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, Droplets, Building2, Users, UserCheck,
    CreditCard, Wrench, ReceiptText, FileBarChart2, Settings,
    LogOut, X, ChevronDown, ChevronRight, Waves
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const navItems = [
    {
        label: 'Dashboard',
        icon: LayoutDashboard,
        to: '/dashboard',
        roles: ['system_admin', 'zonal_admin', 'representative'],
    },
    {
        label: 'Infrastructure',
        icon: Building2,
        roles: ['system_admin', 'zonal_admin'],
        children: [
            { label: 'Zones', to: '/infrastructure/zones', icon: Waves },
            { label: 'Water Tanks', to: '/infrastructure/tanks', icon: Droplets },
            { label: 'Public Taps', to: '/infrastructure/taps', icon: Droplets },
        ],
    },
    {
        label: 'People',
        icon: Users,
        roles: ['system_admin', 'zonal_admin'],
        children: [
            { label: 'Households', to: '/people/households', icon: Building2 },
            { label: 'Community Members', to: '/people/members', icon: Users },
            { label: 'Committee', to: '/people/committee', icon: UserCheck },
            { label: 'Users', to: '/people/users', icon: Settings, roles: ['system_admin'] },
        ],
    },
    {
        label: 'Finance',
        icon: CreditCard,
        roles: ['system_admin', 'zonal_admin'],
        children: [
            { label: 'Subscriptions', to: '/finance/subscriptions', icon: CreditCard },
            { label: 'Payments', to: '/finance/payments', icon: ReceiptText },
            { label: 'Maintenance', to: '/finance/maintenance', icon: Wrench },
            { label: 'Expenditures', to: '/finance/expenditures', icon: ReceiptText },
            { label: 'Committee Payments', to: '/finance/committee-payments', icon: CreditCard },
        ],
    },
    {
        label: 'Reports',
        icon: FileBarChart2,
        to: '/reports',
        roles: ['system_admin', 'zonal_admin'],
    },
    {
        label: 'My Subscription',
        icon: CreditCard,
        to: '/my-subscription',
        roles: ['representative'],
    },
];

function NavItem({ item, userRole, onClose }) {
    const [open, setOpen] = useState(false);

    if (item.roles && !item.roles.includes(userRole)) return null;

    if (item.children) {
        const visibleChildren = item.children.filter(
            c => !c.roles || c.roles.includes(userRole)
        );
        if (visibleChildren.length === 0) return null;

        return (
            <div>
                <button
                    onClick={() => setOpen(p => !p)}
                    className="sidebar-link w-full justify-between group"
                >
                    <span className="flex items-center gap-3.5">
                        <div className="p-2 rounded-xl bg-slate-100 dark:bg-white/10 group-hover:bg-white dark:group-hover:bg-white/20 transition-colors">
                            <item.icon size={18} className="text-slate-600 dark:text-slate-100" />
                        </div>
                        <span className="text-slate-700 dark:text-slate-200 group-hover:text-navy-950 dark:group-hover:text-gold-400 font-bold transition-colors">{item.label}</span>
                    </span>
                    <motion.div
                        animate={{ rotate: open ? 180 : 0 }}
                        className="text-slate-400"
                    >
                        <ChevronDown size={15} />
                    </motion.div>
                </button>
                <AnimatePresence>
                    {open && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: 'circOut' }}
                            className="overflow-hidden pl-11 mt-1 space-y-1"
                        >
                            {visibleChildren.map(child => (
                                <NavLink
                                    key={child.to}
                                    to={child.to}
                                    onClick={onClose}
                                    className={({ isActive }) =>
                                        `flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-black tracking-tight transition-all duration-300 ${
                                            isActive
                                                ? 'text-navy-950 dark:text-gold-400 bg-navy-50/50 dark:bg-gold-500/10'
                                                : 'text-slate-500 dark:text-slate-400 hover:text-navy-900 dark:hover:text-slate-100'
                                        }`
                                    }
                                >
                                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                                    {child.label}
                                </NavLink>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <NavLink
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
                `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
            }
        >
            <div className={`p-2 rounded-xl transition-colors ${
                false ? '' : 'bg-slate-100 dark:bg-white/10 group-hover:bg-white dark:group-hover:bg-white/20'
            }`}>
                <item.icon size={18} />
            </div>
            <span className="font-bold">{item.label}</span>
        </NavLink>
    );
}

export default function Sidebar({ open, onClose }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        toast.success('Logged out successfully');
        navigate('/login');
    };

    return (
        <>
            {/* Overlay */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-navy-950/40 backdrop-blur-md z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            {/* Drawer */}
            <motion.aside
                initial={false}
                animate={{ x: open ? 0 : '-100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed top-0 left-0 h-full w-[280px] sm:w-[320px] z-50
                   bg-white dark:bg-[#050816]
                   border-r border-slate-100 dark:border-white/5
                   flex flex-col shadow-2xl overflow-hidden transition-colors duration-500"
            >
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                     <Waves size={160} className="text-navy-900 dark:text-gold-500" />
                </div>

                {/* Logo Section */}
                <div className="relative px-6 sm:px-8 pt-10 pb-8">
                    <div className="flex items-center gap-4 group">
                        <div className="relative">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-navy-900 to-blue-600 dark:from-gold-600 dark:to-amber-300 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-500" />
                            <div className="relative w-12 h-12 rounded-2xl bg-navy-950 dark:bg-gold-500 flex items-center justify-center shadow-2xl transition-transform duration-500 group-hover:rotate-12">
                                <Waves size={24} className="text-white dark:text-navy-950" />
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="font-black text-xl tracking-tighter text-navy-950 dark:text-white leading-tight">
                                AQUACAM
                            </p>
                            <div className="flex items-center gap-1.5">
                                <span className="h-1 w-1 rounded-full bg-gold-500 animate-pulse" />
                                <p className="text-[10px] uppercase tracking-[0.3em] font-extrabold text-gold-600 dark:text-gold-400">
                                    CONNECT
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className="text-slate-400 dark:text-slate-200" />
                        </button>
                    </div>
                </div>

                {/* User Profile Hook */}
                <div className="px-5 sm:px-6 mb-6">
                    <div className="p-4 rounded-[1.8rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center gap-4">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-navy-800 to-navy-950 dark:from-gold-400 dark:to-gold-600 flex items-center justify-center shadow-lg">
                                <span className="text-sm font-black text-white dark:text-navy-950">
                                    {user?.username?.charAt(0).toUpperCase()}
                                </span>
                            </div>
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-[#050816] rounded-full shadow-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[14px] font-black text-slate-900 dark:text-white truncate">
                                {user?.username}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-black">
                                {user?.role?.replace('_', ' ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Scrollable Area */}
                <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1 custom-scrollbar">
                    {navItems.map(item => (
                        <NavItem
                            key={item.label}
                            item={item}
                            userRole={user?.role}
                            onClose={onClose}
                        />
                    ))}
                </nav>

                {/* Logout Section */}
                <div className="p-4 pt-2">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-6 py-4 rounded-2xl text-[14px] font-black text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all duration-300 group"
                    >
                        <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/20 transition-colors">
                            <LogOut size={18} />
                        </div>
                        Sign Out System
                    </button>
                </div>
            </motion.aside>
        </>
    );
}