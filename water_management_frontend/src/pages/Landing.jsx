import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
    Waves, ShieldCheck, Zap, BarChart3, 
    Droplets, Users, Smartphone, ArrowRight,
    Globe, Database, Lock, FileBarChart2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.6 }
};

const FeatureCard = ({ icon: Icon, title, description, delay }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay }}
        className="p-8 rounded-[2.5rem] bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-xl hover:shadow-2xl transition-all duration-500 group"
    >
        <div className="w-14 h-14 rounded-2xl bg-navy-950 dark:bg-gold-500 flex items-center justify-center text-white dark:text-navy-950 mb-6 group-hover:scale-110 transition-transform duration-500">
            <Icon size={28} />
        </div>
        <h3 className="text-xl font-black text-navy-950 dark:text-white mb-4 tracking-tight">{title}</h3>
        <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{description}</p>
    </motion.div>
);

export default function Landing() {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleCTA = () => {
        if (user) navigate('/dashboard');
        else navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050816] transition-colors duration-500 overflow-x-hidden selection:bg-gold-500/30">
            {/* Background Decorative Elements */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-navy-900/5 dark:bg-gold-500/[0.03] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-navy-900/10 rounded-full blur-[120px]" />
            </div>

            {/* Navbar */}
            <nav className="relative z-50 flex items-center justify-between px-6 sm:px-12 py-8 max-w-7xl mx-auto">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => navigate('/')}>
                    <div className="w-10 h-10 rounded-xl bg-navy-950 dark:bg-gold-500 flex items-center justify-center shadow-lg transition-transform group-hover:rotate-12">
                        <Waves size={20} className="text-white dark:text-navy-950" />
                    </div>
                    <div>
                        <p className="font-black text-lg tracking-tighter text-navy-950 dark:text-white leading-none">AQUACAM</p>
                        <p className="text-[9px] uppercase tracking-[0.3em] font-extrabold text-gold-600 dark:text-gold-400 mt-0.5">CONNECT</p>
                    </div>
                </div>
                <div className="flex items-center gap-4 sm:gap-8">
                    {!user && (
                        <button onClick={() => navigate('/login')} className="text-sm font-black text-slate-500 dark:text-slate-400 hover:text-navy-950 dark:hover:text-gold-500 transition-colors hidden sm:block">
                            Already Registered?
                        </button>
                    )}
                    <button 
                        onClick={handleCTA}
                        className="px-6 py-2.5 rounded-xl bg-navy-950 dark:bg-gold-500 text-white dark:text-navy-950 font-black text-sm shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                    >
                        {user ? 'Dashboard' : 'Access Portal'}
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-16 sm:pt-24 pb-32">
                <div className="max-w-3xl">
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-navy-950/5 dark:bg-gold-500/10 text-navy-950 dark:text-gold-400 text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] mb-8">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Next-Gen Community Infrastructure
                        </span>
                        <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-navy-950 dark:text-white tracking-tighter leading-[0.9] mb-8">
                            Modernizing <br />
                            <span className="text-navy-900 dark:text-gold-400 relative">
                                Water Integrity.
                                <span className="absolute bottom-2 left-0 w-full h-2 sm:h-4 bg-gold-500/20 dark:bg-gold-500/10 -z-10" />
                            </span>
                        </h1>
                        <p className="text-lg sm:text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10 max-w-xl">
                            The professional operating system for community water management. Automated billing, infrastructure telemetry, and financial transparency.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button 
                                onClick={handleCTA}
                                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-navy-950 dark:bg-gold-500 text-white dark:text-navy-950 font-black text-[15px] shadow-2xl shadow-navy-950/20 dark:shadow-gold-500/20 flex items-center justify-center gap-3 hover:-translate-y-1 transition-all group"
                            >
                                {user ? 'Return to Dashboard' : 'Get Started Today'}
                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                            <a href="#features" className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 font-bold text-[15px] flex items-center justify-center hover:bg-slate-50 dark:hover:bg-white/10 transition-all">
                                Explore Capabilities
                            </a>
                        </div>
                    </motion.div>
                </div>

                {/* Floating Stats Hook */}
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="absolute top-1/2 right-6 lg:right-12 hidden xl:block w-[400px]"
                >
                    <div className="p-10 rounded-[3rem] bg-white/40 dark:bg-navy-950/40 backdrop-blur-3xl border border-white dark:border-white/10 shadow-3xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <BarChart3 size={120} className="text-navy-950 dark:text-gold-500" />
                        </div>
                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <ShieldCheck size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">System Uptime</p>
                                    <p className="text-2xl font-black text-navy-950 dark:text-white tracking-tight truncate">99.98% Verification</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-gold-500 text-navy-950 shadow-lg shadow-gold-500/20">
                                    <Zap size={24} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response Latency</p>
                                    <p className="text-2xl font-black text-navy-950 dark:text-white tracking-tight truncate">Real-time Telemetry</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </section>

            {/* Features Grid */}
            <section id="features" className="relative z-10 py-32 px-6 sm:px-12 max-w-7xl mx-auto">
                <div className="text-center max-w-2xl mx-auto mb-20">
                    <span className="text-[11px] font-black uppercase tracking-[0.3em] text-gold-600 dark:text-gold-500">Core Capabilities</span>
                    <h2 className="text-4xl sm:text-5xl font-black text-navy-950 dark:text-white tracking-tighter mt-4 mb-6">Designed for community resilience.</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">Everything you need to manage water infrastructure, ensure transparency, and automate billing cycles at scale.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <FeatureCard 
                        icon={Smartphone}
                        delay={0.1}
                        title="Mobile Optimized" 
                        description="Access full infrastructure vitals and payment history from any device, anywhere in the world." 
                    />
                    <FeatureCard 
                        icon={Database}
                        delay={0.2}
                        title="Telemetry Control" 
                        description="Monitor tank levels and public tap status in real-time with granular operational metrics." 
                    />
                    <FeatureCard 
                        icon={Lock}
                        delay={0.3}
                        title="Billing Integrity" 
                        description="Fully automated subscription tracking with multi-tier status reporting for the entire community." 
                    />
                </div>
            </section>

            {/* Value Prop Section */}
            <section className="relative z-10 py-32 px-6 sm:px-12 bg-navy-950 dark:bg-white/[0.02] overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/10 rounded-full blur-[160px] pointer-events-none" />
                
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                    <motion.div {...fadeInUp}>
                        <h3 className="text-4xl sm:text-5xl font-black text-white tracking-tighter mb-8 leading-tight">
                            Total transparency in water governance.
                        </h3>
                        <div className="space-y-8">
                            {[
                                { icon: Globe, t: 'Global Zonal Management', d: 'Partition your infrastructure into logical zones for easier committee oversight.' },
                                { icon: Users, t: 'Representative Focus', d: 'Assign household leads to maintain accountability and streamlined communication.' },
                                { icon: FileBarChart2, t: 'Audit-Ready Reports', d: 'Generate comprehensive financial audits and maintenance logs with a single click.' }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center shrink-0">
                                        <item.icon className="text-gold-500" size={24} />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-black text-white mb-2 leading-none">{item.t}</h4>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{item.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="relative"
                    >
                        <div className="p-4 rounded-[3rem] bg-white/5 border border-white/10 backdrop-blur-xl">
                            <img 
                                src="https://images.unsplash.com/photo-1541814671607-06385b57f002?q=80&w=2070&auto=format&fit=crop" 
                                alt="Water Telemetry Interface" 
                                className="rounded-[2.5rem] shadow-2xl"
                            />
                        </div>
                        {/* Interactive floating pill */}
                        <div className="absolute -bottom-6 -right-6 p-6 rounded-[2rem] bg-gold-500 text-navy-950 shadow-2xl flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-navy-950 flex items-center justify-center">
                                <Droplets size={20} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Live Flow Rate</p>
                                <p className="text-xl font-bold tracking-tight leading-none">High Stability</p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 px-6 sm:px-12 py-20 max-w-7xl mx-auto border-t border-slate-200 dark:border-white/5">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-navy-950 dark:bg-gold-500 flex items-center justify-center">
                                <Waves size={16} className="text-white dark:text-navy-950" />
                            </div>
                            <p className="font-black text-sm tracking-tighter text-navy-950 dark:text-white">AQUACAM CONNECT</p>
                        </div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                            © 2026 AquaCam Systems. All Rights Reserved.
                        </p>
                    </div>
                    <div className="flex gap-8">
                        <a href="#" className="text-sm font-black text-slate-500 dark:text-slate-400 hover:text-navy-950 dark:hover:text-gold-500 transition-colors">Documentation</a>
                        <a href="#" className="text-sm font-black text-slate-500 dark:text-slate-400 hover:text-navy-950 dark:hover:text-gold-500 transition-colors">System Status</a>
                        <a href="#" className="text-sm font-black text-slate-500 dark:text-slate-400 hover:text-navy-950 dark:hover:text-gold-500 transition-colors">Privacy</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}
