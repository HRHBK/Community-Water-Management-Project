import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileBarChart2, Download, FileText, Users, Wrench, AlertCircle, CreditCard, Calendar, FileType, ArrowRight } from 'lucide-react';
import { reportAPI, householdAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import toast from 'react-hot-toast';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 6 }, (_, i) => currentYear - i);

function ReportCard({ icon: Icon, title, description, color, action, index }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="stat-card p-8 flex flex-col gap-6 group hover:border-navy-950/20 dark:hover:border-gold-500/20"
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-5">
                    <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                        <Icon size={28} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-navy-950 dark:text-white tracking-tight group-hover:text-navy-900 dark:group-hover:text-gold-400 transition-colors">
                            {title}
                        </h3>
                        <p className="text-[13px] font-medium text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                            {description}
                        </p>
                    </div>
                </div>
            </div>
            <div className="pt-4 border-t border-slate-50 dark:border-white/5">
                {action}
            </div>
        </motion.div>
    );
}

export default function Reports() {
    const [year, setYear] = useState(currentYear);
    const [households, setHouseholds] = useState([]);
    const [householdId, setHouseholdId] = useState('');
    const [format, setFormat] = useState('pdf');
    const [loading, setLoading] = useState({});

    useEffect(() => {
        householdAPI.getAll().then(r => setHouseholds(r.data.households || [])).catch(() => { });
    }, []);

    const openReport = (url, key) => {
        setLoading(prev => ({ ...prev, [key]: true }));
        window.open(url, '_blank');
        setTimeout(() => setLoading(prev => ({ ...prev, [key]: false })), 2000);
    };

    return (
        <div className="space-y-10">
            <PageHeader
                title="Intelligence"
                description="Extract analytical insights, financial statements, and operational performance metrics."
            />

            {/* Global Refined Filter Section */}
            <div className="flex flex-col lg:flex-row gap-6 p-10 rounded-[2.5rem] bg-white/40 dark:bg-white/5 backdrop-blur-2xl border border-white dark:border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <FileBarChart2 size={120} className="text-navy-950 dark:text-gold-500" />
                </div>

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-8 w-full md:w-auto">
                    <div className="space-y-2 w-full sm:w-auto">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Fiscal Window</label>
                        <div className="relative group min-w-[200px]">
                            <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors pointer-events-none" />
                            <select 
                                value={year} 
                                onChange={e => setYear(Number(e.target.value))}
                                className="input pl-12 bg-white dark:bg-black/40 border-slate-200"
                            >
                                {years.map(y => <option key={y} value={y}>Fiscal Year {y}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2 w-full sm:w-auto">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Output Standard</label>
                        <div className="relative group min-w-[150px]">
                            <FileType size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors pointer-events-none" />
                            <select 
                                value={format} 
                                onChange={e => setFormat(e.target.value)}
                                className="input pl-12 bg-white dark:bg-black/40 border-slate-200"
                            >
                                <option value="pdf">Adobe PDF</option>
                                <option value="xlsx">MS Excel</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex-1 lg:flex flex-col justify-center hidden">
                    <p className="text-[14px] font-bold text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                        Configure your fiscal window and document format to generate encrypted reports.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Annual Finance */}
                <ReportCard
                    index={0}
                    icon={FileBarChart2}
                    title="Audit Report"
                    description="Consolidated annual finance audit including income and net deltas."
                    color="bg-navy-900 text-white"
                    action={
                        <button
                            onClick={() => openReport(reportAPI.annualFinance(year, format), 'annual')}
                            disabled={loading.annual}
                            className="btn-primary w-full group/btn"
                        >
                            <Download size={18} className="group-hover/btn:-translate-y-1 transition-transform" />
                            {loading.annual ? 'Generating...' : 'Export Fiscal Audit'}
                        </button>
                    }
                />

                {/* Overdue Subscriptions */}
                <ReportCard
                    index={1}
                    icon={AlertCircle}
                    title="Delinquency Map"
                    description="Detailed registry of accounts with non-compliant payment status."
                    color="bg-rose-500 text-white"
                    action={
                        <button
                            onClick={() => openReport(reportAPI.overdueSubscriptions(year, format), 'overdue')}
                            disabled={loading.overdue}
                            className="btn-danger w-full group/btn !bg-rose-500"
                        >
                            <Download size={18} className="group-hover/btn:-translate-y-1 transition-transform" />
                            {loading.overdue ? 'Extracting...' : 'Export Overdue Registry'}
                        </button>
                    }
                />

                {/* Maintenance Costs */}
                <ReportCard
                    index={2}
                    icon={Wrench}
                    title="Infrastructure OPEX"
                    description="Granular breakdown of maintenance works and operational expenditures."
                    color="bg-amber-500 text-white"
                    action={
                        <button
                            onClick={() => openReport(reportAPI.maintenanceCost(year, format), 'maintenance')}
                            disabled={loading.maintenance}
                            className="btn-primary !bg-amber-500 border-none w-full group/btn text-navy-950"
                        >
                            <Download size={18} className="group-hover/btn:-translate-y-1 transition-transform" />
                            {loading.maintenance ? 'compiling...' : 'Export OPEX Metrics'}
                        </button>
                    }
                />

                {/* Committee Payments */}
                <ReportCard
                    index={3}
                    icon={CreditCard}
                    title="Remuneration Ledger"
                    description="Comprehensive log of all committee honorariums and payments."
                    color="bg-indigo-600 text-white"
                    action={
                        <button
                            onClick={() => openReport(reportAPI.committeePayments(year, format), 'committee')}
                            disabled={loading.committee}
                            className="btn-primary !bg-indigo-600 border-none w-full group/btn"
                        >
                            <Download size={18} className="group-hover/btn:-translate-y-1 transition-transform" />
                            {loading.committee ? 'Mapping...' : 'Export Ledger Data'}
                        </button>
                    }
                />

                {/* Subscription Statement */}
                <div className="md:col-span-2">
                    <ReportCard
                        index={4}
                        icon={FileText}
                        title="Residential Statement"
                        description="Generate a detailed financial footprint for a specific residential account."
                        color="bg-emerald-600 text-white"
                        action={
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="relative flex-1 group">
                                    <Home size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors pointer-events-none" />
                                    <select
                                        value={householdId}
                                        onChange={e => setHouseholdId(e.target.value)}
                                        className="input pl-12 bg-slate-50 dark:bg-white/5 border-slate-200"
                                    >
                                        <option value="">Select account residency...</option>
                                        {households.map(h => (
                                            <option key={h.id} value={h.id}>
                                                {h.house_number} — {h.street_address}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <button
                                    onClick={() => {
                                        if (!householdId) { toast.error('Please select an account first'); return; }
                                        openReport(reportAPI.subscriptionStatement(householdId, year, format), 'statement');
                                    }}
                                    disabled={loading.statement || !householdId}
                                    className="btn-primary !bg-emerald-600 border-none min-w-[240px] group/btn"
                                >
                                    <Download size={18} className="group-hover/btn:-translate-y-1 transition-transform" />
                                    {loading.statement ? 'Compiling...' : 'Download Statement'}
                                </button>
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    );
}