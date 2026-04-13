import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, CreditCard, Search, Calendar, MapPin, Users, ArrowUpRight, DollarSign } from 'lucide-react';
import { subscriptionAPI, householdAPI, rateAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Subscriptions() {
    const [subscriptions, setSubscriptions] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear());
    const [modal, setModal] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [s, h, r] = await Promise.all([
                subscriptionAPI.getAll(),
                householdAPI.getAll(),
                rateAPI.getAll(),
            ]);
            setSubscriptions(s.data.subscriptions || []);
            setHouseholds(h.data.households || []);
            setRates(r.data.rates || []);
        } catch { toast.error('Failed to load subscriptions'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        try {
            await subscriptionAPI.create(data);
            toast.success('Subscription created');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const filtered = subscriptions.filter(s =>
        s.year == yearFilter &&
        `${s.household_address} ${s.zone_name}`
            .toLowerCase().includes(search.toLowerCase())
    );

    const statusBadge = (s) => {
        if (s.status === 'paid') return <span className="badge-paid">Full Compliance</span>;
        if (s.status === 'partial') return <span className="badge-partial">Partial Remittance</span>;
        return <span className="badge-unpaid">Pending Payment</span>;
    };

    const currentYear = new Date().getFullYear();
    const years = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) years.push(y);

    return (
        <div className="space-y-8">
            <PageHeader
                title="Management"
                description="Oversee annual subscription cycles, monitor payment compliance, and manage residential rates."
                action={
                    <button onClick={() => { reset(); setModal(true); }}
                        className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Init Subscription
                    </button>
                }
            />

            {/* Premium Filter Strip */}
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                    <div className="relative w-full sm:w-80 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Find by address or sector..." 
                            className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200 focus:border-navy-950/20 dark:focus:border-gold-500/20" 
                        />
                    </div>
                    
                    <div className="relative w-full sm:w-44 group">
                        <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors pointer-events-none" />
                        <select 
                            value={yearFilter} 
                            onChange={e => setYearFilter(Number(e.target.value))}
                            className="input pl-12 appearance-none bg-white/50 dark:bg-white/5 border-slate-200"
                        >
                            {years.map(y => <option key={y} value={y}>Fiscal Year {y}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent">
                    <div className="flex flex-col text-right">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Compliance Rate</span>
                        <p className="text-[13px] font-black text-navy-950 dark:text-gold-400">
                            {filtered.length > 0 ? Math.round((filtered.filter(s => s.status === 'paid').length / filtered.length) * 100) : 0}%
                        </p>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-navy-950 dark:bg-gold-500 flex items-center justify-center shadow-lg">
                        <ArrowUpRight size={18} className="text-white dark:text-navy-950" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Loading Financial Records...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={CreditCard} title="No Records for {yearFilter}"
                    description="This fiscal year has no active subscriptions registered for the current selection."
                    action={<button onClick={() => setModal(true)} className="btn-primary">New Subscription Cycle</button>} />
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left py-5 px-6">Residential Account</th>
                                    <th className="text-left py-5 px-6 hidden sm:table-cell">Sector</th>
                                    <th className="text-right py-5 px-6 hidden md:table-cell">Target (FCFA)</th>
                                    <th className="text-right py-5 px-6 hidden md:table-cell">Remitted</th>
                                    <th className="text-right py-5 px-6 hidden lg:table-cell">Outstanding</th>
                                    <th className="py-5 px-6 text-center">Legal Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                <AnimatePresence>
                                    {filtered.map((s, i) => (
                                        <motion.tr 
                                            key={s.id}
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }} 
                                            className="table-row group"
                                        >
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-navy-950 group-hover:text-white dark:group-hover:bg-gold-500 dark:group-hover:text-navy-950 transition-all duration-300">
                                                        <Building2 size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-navy-950 dark:text-white leading-tight">
                                                            {s.household_address}
                                                        </p>
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <Users size={12} className="text-slate-300" />
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{s.member_count} Members</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden sm:table-cell text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                                {s.zone_name}
                                            </td>
                                            <td className="py-5 px-6 hidden md:table-cell text-right text-[13px] font-black text-navy-950 dark:text-white">
                                                {Number(s.amount_due).toLocaleString()}
                                            </td>
                                            <td className="py-5 px-6 hidden md:table-cell text-right">
                                                <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400">
                                                    {Number(s.amount_paid || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 hidden lg:table-cell text-right">
                                                <span className={`text-[13px] font-black ${s.balance > 0 ? 'text-rose-500 dark:text-rose-400' : 'text-slate-300'}`}>
                                                    {Number(s.balance || s.amount_due).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                {statusBadge(s)}
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            <Modal open={modal} onClose={() => setModal(false)} title="Init Subscription Cycle" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div className="sm:col-span-2">
                            <label className="label">Account Residence *</label>
                            <div className="relative">
                                <Home size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('household_id', { required: 'Required' })} className="input pl-11">
                                    <option value="">Select account to bill...</option>
                                    {households.map(h => (
                                        <option key={h.id} value={h.id}>{h.house_number} — {h.street_address}</option>
                                    ))}
                                </select>
                            </div>
                            {errors.household_id && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.household_id.message}</p>}
                        </div>
                        
                        <div>
                            <label className="label">Fiscal Cycle *</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('year', { required: 'Required' })} className="input pl-11">
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="label">Occupancy Scale *</label>
                            <div className="relative">
                                <Users size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('member_count', { required: 'Required', min: 1 })}
                                    type="number" className="input pl-11" placeholder="Active occupants" />
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="label">Applicable Rate *</label>
                            <div className="relative">
                                <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('rate_id', { required: 'Required' })} className="input pl-11">
                                    <option value="">Select active financial rate...</option>
                                    {rates.map(r => (
                                        <option key={r.id} value={r.id}>
                                            FCFA {Number(r.rate_per_person).toLocaleString()} /Person ({r.year})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {errors.rate_id && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.rate_id.message}</p>}
                        </div>
                    </div>
                    
                    <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : 'Authorize Subscription'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}