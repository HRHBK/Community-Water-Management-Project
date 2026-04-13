import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { Toaster } from 'react-hot-toast';

const pageTitles = {
    '/dashboard': 'Dashboard',
    '/infrastructure/zones': 'Water Zones',
    '/infrastructure/tanks': 'Water Tanks',
    '/infrastructure/taps': 'Public Taps',
    '/people/households': 'Households',
    '/people/members': 'Community Members',
    '/people/committee': 'Committee Members',
    '/people/users': 'User Management',
    '/finance/subscriptions': 'Subscriptions',
    '/finance/payments': 'Subscription Payments',
    '/finance/maintenance': 'Maintenance Works',
    '/finance/expenditures': 'Expenditures',
    '/finance/committee-payments': 'Committee Payments',
    '/reports': 'Reports',
    '/my-subscription': 'My Subscription',
};

export default function Layout({ children }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();
    const title = pageTitles[location.pathname] || 'AquaCam Connect';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050816] transition-colors duration-500 overflow-x-hidden">
            {/* Optimized Background Reactive Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-5%] left-[-5%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-navy-900/5 dark:bg-gold-500/[0.03] rounded-full blur-[80px] sm:blur-[120px]" />
                <div className="absolute bottom-[-5%] right-[-5%] w-[60%] h-[60%] sm:w-[40%] sm:h-[40%] bg-blue-500/5 dark:bg-navy-900/10 rounded-full blur-[80px] sm:blur-[120px]" />
            </div>

            <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <div className="flex flex-col min-h-screen relative z-10">
                <Header
                    onMenuClick={() => setSidebarOpen(true)}
                    title={title}
                />
                <main className="flex-1 px-4 py-6 md:p-8 lg:p-10 max-w-[1600px] mx-auto w-full transition-all duration-300">
                    {children}
                </main>
            </div>

            <Toaster
                position="top-right"
                toastOptions={{
                    className: 'glass dark:!bg-navy-900/90 dark:!text-white !rounded-2xl !border-white/10 !shadow-2xl !text-[13px] font-black tracking-tight',
                    duration: 3000,
                    style: {
                        backdropFilter: 'blur(20px)',
                    }
                }}
            />
        </div>
    );
}