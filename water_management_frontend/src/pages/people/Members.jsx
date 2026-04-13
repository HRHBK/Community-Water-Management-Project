import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Users, Search, Phone, Mail, Home, ShieldCheck, User as UserIcon } from 'lucide-react';
import { memberAPI, householdAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Members() {
    const [members, setMembers] = useState([]);
    const [households, setHouseholds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [m, h] = await Promise.all([memberAPI.getAll(), householdAPI.getAll()]);
            setMembers(m.data.members || []);
            setHouseholds(h.data.households || []);
        } catch { toast.error('Failed to load members'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (m) => {
        setEditing(m);
        ['first_name', 'last_name', 'phone', 'email', 'gender', 'household_id', 'is_representative']
            .forEach(f => setValue(f, m[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        data.is_representative = data.is_representative ? 1 : 0;
        try {
            if (editing) { await memberAPI.update(editing.id, data); toast.success('Member updated'); }
            else { await memberAPI.create(data); toast.success('Member created'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await memberAPI.delete(deleting.id);
            toast.success('Member deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete member'); }
    };

    const filtered = members.filter(m =>
        `${m.first_name} ${m.last_name} ${m.phone} ${m.household_address}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Community Registry"
                description="Comprehensive database of all community members and their residential associations."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Enroll New Member
                    </button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by name, phone, or residence..." 
                        className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200" 
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Users size={12} className="text-navy-900 dark:text-gold-400" />
                    Registered Citizens: <span className="text-navy-950 dark:text-gold-400 ml-1">{members.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Population Data...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Users} title="Empty Registry"
                    description="No community members have been registered yet. Start the enrollment process."
                    action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Enroll Member</button>} />
            ) : (
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="card overflow-hidden"
                >
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left py-5 px-6">Identified Citizen</th>
                                    <th className="text-left py-5 px-6 hidden sm:table-cell">Contact Metrics</th>
                                    <th className="text-left py-5 px-6 hidden md:table-cell">Primary Residence</th>
                                    <th className="text-center py-5 px-6 hidden lg:table-cell">Gender</th>
                                    <th className="text-center py-5 px-6">Assignment</th>
                                    <th className="py-5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                <AnimatePresence>
                                    {filtered.map((m, i) => (
                                        <motion.tr 
                                            key={m.id}
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }} 
                                            className="table-row group"
                                        >
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[14px] bg-gradient-to-br from-slate-50 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-[11px] font-black text-navy-950 dark:text-gold-400 shadow-sm transition-transform duration-300 group-hover:scale-110">
                                                        {m.first_name[0].toUpperCase()}{m.last_name[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-navy-950 dark:text-white leading-tight">
                                                            {m.first_name} {m.last_name}
                                                        </p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                            ID-C{m.id.toString().padStart(4, '0')}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden sm:table-cell">
                                                <div className="space-y-1">
                                                    {m.phone && (
                                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                                            <Phone size={10} className="text-slate-300" />
                                                            <span className="text-[12px] font-bold">{m.phone}</span>
                                                        </div>
                                                    )}
                                                    {m.email && (
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <Mail size={10} className="text-slate-300" />
                                                            <span className="text-[11px] font-medium truncate max-w-[120px]">{m.email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden md:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <Home size={12} className="text-slate-300" />
                                                    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                                                        {m.household_address || '—'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 text-center hidden lg:table-cell">
                                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                                    {m.gender || '—'}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                {m.is_representative ? (
                                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                        <ShieldCheck size={11} />
                                                        Rep
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 opacity-60">Citizen</span>
                                                )}
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(m)}
                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleting(m)}
                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            <Modal open={modal} onClose={() => setModal(false)}
                title={editing ? 'Update Enrollment' : 'Citizen Enrollment'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <label className="label">First Name *</label>
                            <input {...register('first_name', { required: 'Required' })} className="input" placeholder="e.g. John" />
                            {errors.first_name && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.first_name.message}</p>}
                        </div>
                        <div>
                            <label className="label">Last Name *</label>
                            <input {...register('last_name', { required: 'Required' })} className="input" placeholder="e.g. Doe" />
                            {errors.last_name && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.last_name.message}</p>}
                        </div>
                        <div>
                            <label className="label">Primary Phone</label>
                            <div className="relative">
                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('phone')} className="input pl-11" placeholder="+237 6XX XXX XXX" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Digital Mail</label>
                            <div className="relative">
                                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('email')} type="email" className="input pl-11" placeholder="john.doe@domain.com" />
                            </div>
                        </div>
                        <div>
                            <label className="label">Bio Gender</label>
                            <select {...register('gender')} className="input">
                                <option value="">Select gender profile...</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Residence Account *</label>
                            <div className="relative">
                                <Home size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('household_id', { required: 'Required' })} className="input pl-11">
                                    <option value="">Link to residence...</option>
                                    {households.map(h => (
                                        <option key={h.id} value={h.id}>
                                            {h.house_number} ({h.zone_name})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                             <label className="relative flex items-center gap-4 p-5 rounded-[1.8rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 cursor-pointer hover:border-navy-950/20 dark:hover:border-gold-500/20 transition-all">
                                <input type="checkbox" {...register('is_representative')}
                                    className="w-5 h-5 accent-navy-950 dark:accent-gold-500 rounded-lg" />
                                <div className="flex flex-col">
                                    <span className="text-[13px] font-black text-navy-950 dark:text-white uppercase tracking-widest leading-none mb-1">Account Representative</span>
                                    <span className="text-[11px] font-bold text-slate-400">Designate this citizen as the primary legal head of the household account.</span>
                                </div>
                             </label>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : editing ? 'Finalize Changes' : 'Complete Enrollment'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke Enrollment" size="sm">
                <div className="p-4 space-y-6 text-center">
                    <div className="p-6 rounded-[2.5rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            Confirm permanent revocation of enrollment for:<br/>
                            <span className="text-xl font-black block mt-2">{deleting?.first_name} {deleting?.last_name}</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 font-black uppercase tracking-widest text-[11px]">Abort</button>
                        <button onClick={confirmDelete} className="btn-danger flex-1 font-black uppercase tracking-widest text-[11px]">Confirm Revocation</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}