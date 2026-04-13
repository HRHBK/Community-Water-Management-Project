import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    Droplets, Home, Users, TrendingUp,
    TrendingDown, Wrench, AlertCircle, CheckCircle2, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { financeAPI, householdAPI, tankAPI, subscriptionAPI } from '../../services/api';
import Spinner from '../../components/ui/Spinner';
import { useAuth } from '../../context/AuthContext';
import { format } from 'date-fns';

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i) => ({
        opacity: 1,
        y: 0,
        transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }
    }),
};

function StatCard({ icon: Icon, label, value, sub, color, index, trend }) {
    return (
        <motion.div
            custom={index}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="stat-card group"
        >
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 bg-current opacity-[0.03] group-hover:opacity-[0.05] rounded-full transition-all duration-500 transform group-hover:scale-110" />
            
            <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-2xl ${color} shadow-lg shadow-current/20 flex items-center justify-center`}>
                    <Icon size={24} className="text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[11px] font-black px-2 py-1 rounded-lg ${
                        trend > 0 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                    }`}>
                        {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(trend)}%
                    </div>
                )}
            </div>
            
            <div className="relative">
                <p className="text-[12px] font-black uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400 mb-1 group-hover:text-slate-600 dark:group-hover:text-gold-400 transition-colors">
                    {label}
                </p>
                <h3 className="text-xl md:text-2xl font-black text-navy-950 dark:text-white tracking-tight">
                    {value}
                </h3>
                {sub && (
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1.5 leading-none">
                        <span className="w-1.5 h-1.5 rounded-full bg-navy-950/10 dark:bg-gold-500/30" />
                        {sub}
                    </p>
                )}
            </div>
        </motion.div>
    );
}

export default function Dashboard() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [tanks, setTanks] = useState([]);
    const [subStats, setSubStats] = useState(null);
    const year = new Date().getFullYear();

    useEffect(() => {
        const fetch = async () => {
            try {
                const [fin, tnk, sub] = await Promise.all([
                    financeAPI.getYearSummary(year),
                    tankAPI.getAll(),
                    subscriptionAPI.getAll(),
                ]);
                setSummary(fin.data);
                setTanks(tnk.data.tanks || []);

                const subs = sub.data.subscriptions || [];
                const currentYear = subs.filter(s => s.year == year);
                setSubStats({
                    total: currentYear.length,
                    paid: currentYear.filter(s => s.status === 'paid').length,
                    partial: currentYear.filter(s => s.status === 'partial').length,
                    unpaid: currentYear.filter(s => s.status === 'unpaid').length,
                });
            } catch { }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Spinner size="lg" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Initializing Dashboard...</p>
            </div>
        );
    }

    const fin = summary?.finance_summary;
    const pieData = subStats ? [
        { name: 'Fully Paid', value: subStats.paid },
        { name: 'Partial', value: subStats.partial },
        { name: 'Pending', value: subStats.unpaid },
    ] : [];

    const CHART_COLORS = ['#10b981', '#FFB800', '#ef4444'];

    return (
        <div className="space-y-6 md:space-y-10">
            {/* Header / Welcome Area */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-1"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 rounded-lg bg-gold-500/10 text-gold-600 dark:text-gold-400 text-[10px] font-black uppercase tracking-wider">
                            Global Pulse
                        </span>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            {format(new Date(), 'EEEE, dd MMM')}
                        </span>
                    </div>
                    <h1 className="text-3xl font-black text-navy-950 dark:text-white tracking-tighter sm:text-5xl leading-tight">
                        Welcome back, <span className="text-navy-900 dark:text-gold-400 relative inline-block group">
                            {user?.username}
                            <span className="absolute bottom-1 left-0 w-full h-1.5 bg-gold-500/30 dark:bg-gold-500/20 rounded-full group-hover:h-3 transition-all duration-300 -z-10" />
                        </span>
                    </h1>
                    <p className="text-slate-600 dark:text-slate-300 font-bold pt-1 text-sm md:text-base">
                        Here's what's happening in <span className="text-navy-950 dark:text-gold-500 font-extrabold">AquaCam Connect</span> today.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-wrap gap-3"
                >
                    <button className="btn-secondary px-4 md:px-6">
                        <AlertCircle size={16} />
                        <span className="hidden sm:inline">View</span> Alerts
                    </button>
                    <button className="btn-primary px-4 md:px-6">
                        <TrendingUp size={16} />
                        <span className="hidden sm:inline">Financial</span> Report
                    </button>
                </motion.div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    index={0}
                    icon={TrendingUp}
                    label="Total Revenue"
                    value={`FCFA ${fin ? Number(fin.total_income).toLocaleString() : '—'}`}
                    color="bg-emerald-500 text-emerald-500"
                    trend={12}
                />
                <StatCard
                    index={1}
                    icon={TrendingDown}
                    label="Operational OPEX"
                    value={`FCFA ${fin ? Number(fin.total_expenditure).toLocaleString() : '—'}`}
                    color="bg-rose-500 text-rose-500"
                    trend={-5}
                />
                <StatCard
                    index={2}
                    icon={Droplets}
                    label="Hydration Health"
                    value={`${tanks.length} Units`}
                    sub={`${tanks.filter(t => (t.current_level / t.capacity_litres) > 0.5).length} Active`}
                    color="bg-sky-500 text-sky-500"
                />
                <StatCard
                    index={3}
                    icon={Home}
                    label="Households"
                    value={subStats?.total || '—'}
                    sub={`${subStats?.paid || 0} Fully Paid`}
                    color="bg-gold-500 text-gold-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                {/* Subscription Analysis */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="card p-6 md:p-8 lg:col-span-1"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-navy-950 dark:text-white tracking-tight">
                                Revenue Compliance
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Status Overview {year}</p>
                        </div>
                        <div className="w-10 h-10 rounded-2xl bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                            <Users size={18} className="text-slate-400" />
                        </div>
                    </div>
                    
                    <div className="h-64">
                        {subStats && (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={65}
                                        outerRadius={85}
                                        paddingAngle={6}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={CHART_COLORS[index % CHART_COLORS.length]}
                                                className="focus:outline-none"
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            background: '#fff',
                                            border: 'none',
                                            borderRadius: '16px',
                                            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
                                            padding: '12px'
                                        }}
                                        itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                                    />
                                    <Legend 
                                        verticalAlign="bottom" 
                                        height={36} 
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value) => <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </motion.div>

                {/* Infrastructure Vitals */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card p-6 md:p-8 lg:col-span-2"
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-navy-950 dark:text-white tracking-tight">
                                Infrastructure Vitals
                            </h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Live Water Tank Levels</p>
                        </div>
                        <div className="flex gap-2">
                             <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 text-[10px] font-extrabold uppercase tracking-wider">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                Live
                             </div>
                        </div>
                    </div>

                    <div className="grid gap-6">
                        {tanks.slice(0, 5).map((tank, i) => {
                            const pct = Math.round((tank.current_level / tank.capacity_litres) * 100);
                            const color = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-gold-500' : 'bg-rose-500';
                            
                            return (
                                <motion.div 
                                    key={tank.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.6 + (i * 0.1) }}
                                    className="group"
                                >
                                    <div className="flex justify-between items-end mb-2.5 px-1">
                                        <div>
                                            <span className="text-[13px] font-black text-navy-950 dark:text-white group-hover:text-gold-500 transition-colors">
                                                {tank.name}
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                                                {tank.zone_name}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[14px] font-black text-navy-950 dark:text-gold-400">
                                                {pct}%
                                            </span>
                                            <p className="text-[10px] text-slate-400 font-bold tracking-widest mb-0.5">
                                                {Number(tank.current_level).toLocaleString()} / {Number(tank.capacity_litres).toLocaleString()} L
                                            </p>
                                        </div>
                                    </div>
                                    <div className="h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative border border-white dark:border-white/5">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${pct}%` }}
                                            transition={{ duration: 1.2, ease: "circOut" }}
                                            className={`h-full rounded-full ${color} relative`}
                                        >
                                            <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-r from-transparent to-white/30" />
                                        </motion.div>
                                    </div>
                                </motion.div>
                            );
                        })}
                        {tanks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 gap-3">
                                <AlertCircle size={32} className="text-slate-200" />
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No telemetry data available</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Quick Summary Strip */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="card p-1 pb-1 overflow-hidden"
            >
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100 dark:divide-white/5">
                    {[
                        { label: 'Base Units', value: subStats?.total || 0, icon: Home },
                        { label: 'Health', value: '98%', icon: CheckCircle2, sub: 'Opt' },
                        { label: 'Support', value: 4, icon: Wrench, sub: 'Low' },
                        { label: 'Uptime', value: '100%', icon: Droplets },
                    ].map(({ label, value, icon: Icon, sub }, i) => (
                        <div key={label} className="px-4 md:px-8 py-6 md:py-8 group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-default">
                             <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 group-hover:text-navy-900 dark:group-hover:text-gold-400 transition-colors">
                                    <Icon size={14} />
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
                             </div>
                             <div className="flex items-baseline gap-2">
                                <h4 className="text-xl md:text-2xl font-black text-navy-950 dark:text-white tracking-tighter">{value}</h4>
                                {sub && <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hidden sm:inline">{sub}</span>}
                             </div>
                        </div>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}