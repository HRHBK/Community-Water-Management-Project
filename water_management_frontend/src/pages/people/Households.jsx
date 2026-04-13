import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Home, Search, MapPin, Users, Building2, ChevronRight } from 'lucide-react';
import { householdAPI, zoneAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Households() {
    const [households, setHouseholds] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [h, z] = await Promise.all([householdAPI.getAll(), zoneAPI.getAll()]);
            setHouseholds(h.data.households || []);
            setZones(z.data.zones || []);
        } catch { toast.error('Failed to load households'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (h) => {
        setEditing(h);
        ['house_number', 'street_address', 'landmark', 'zone_id']
            .forEach(f => setValue(f, h[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) { await householdAPI.update(editing.id, data); toast.success('Household updated'); }
            else { await householdAPI.create(data); toast.success('Household created'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await householdAPI.delete(deleting.id);
            toast.success('Household deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete household'); }
    };

    const filtered = households.filter(h =>
        `${h.house_number} ${h.street_address} ${h.zone_name}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Households"
                description="Manage the registry of community residences and their designated representatives."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Register Residence
                    </button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by address, ID, or zone..." 
                        className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200 focus:border-navy-950/20 dark:focus:border-gold-500/20" 
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Building2 size={12} />
                    Total Residences: <span className="text-navy-950 dark:text-gold-400 ml-1">{households.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Registry...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Home} title="Registry Empty"
                    description="No households have been registered in the system yet. Map out your first residence to begin."
                    action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Register Residence</button>} />
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
                                    <th className="text-left py-5 px-6">Residential Details</th>
                                    <th className="text-left py-5 px-6 hidden sm:table-cell">Geographic Zone</th>
                                    <th className="text-left py-5 px-6 hidden lg:table-cell">Representative</th>
                                    <th className="text-center py-5 px-6 hidden md:table-cell">Scale</th>
                                    <th className="py-5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                <AnimatePresence>
                                    {filtered.map((h, i) => (
                                        <motion.tr 
                                            key={h.id}
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }} 
                                            className="table-row group"
                                        >
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-navy-900 group-hover:text-white dark:group-hover:bg-gold-500 dark:group-hover:text-navy-950 transition-all duration-300">
                                                        <Home size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-navy-950 dark:text-white leading-tight">
                                                            {h.house_number}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">
                                                            {h.street_address}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-slate-300" />
                                                    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                                        {h.zone_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden lg:table-cell">
                                                {h.representative_name ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500">
                                                            {h.representative_name.charAt(0)}
                                                        </div>
                                                        <span className="text-[13px] font-bold text-slate-600 dark:text-slate-200">
                                                            {h.representative_name}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-300 italic">Not Assigned</span>
                                                )}
                                            </td>
                                            <td className="py-5 px-6 text-center hidden md:table-cell">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-[11px] font-black text-slate-500 transition-colors group-hover:bg-emerald-500/10 group-hover:text-emerald-600">
                                                    <Users size={12} />
                                                    {h.member_count || 0}
                                                </div>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(h)}
                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleting(h)}
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
                title={editing ? 'Update Registry' : 'Register Residence'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="label">Unit Identifier *</label>
                            <input {...register('house_number', { required: 'Required' })}
                                className="input" placeholder="e.g. BLK-A41" />
                            {errors.house_number && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wide">{errors.house_number.message}</p>}
                        </div>
                        <div>
                            <label className="label">Allocation Zone *</label>
                            <select {...register('zone_id', { required: 'Zone is required' })} className="input">
                                <option value="">Select geographic sector</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                            {errors.zone_id && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wide">{errors.zone_id.message}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Full Street Address *</label>
                            <div className="relative">
                                <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('street_address', { required: 'Required' })}
                                    className="input pl-11" placeholder="e.g. Mile 16, Upper Bakweri Town" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Locality Landmark</label>
                            <input {...register('landmark')} className="input"
                                placeholder="e.g. Near the community health center" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Discard</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Processing...' : editing ? 'Finalize Changes' : 'Complete Registration'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke Registry" size="sm">
                <div className="p-4 space-y-6">
                    <div className="p-5 rounded-[1.8rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-center">
                        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            Confirm revocation of registration for:<br/>
                            <span className="text-lg font-black block mt-2">{deleting?.house_number}</span>
                            <span className="text-[10px] uppercase font-black opacity-60">{deleting?.street_address}</span>
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