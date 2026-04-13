import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Droplets, Search, MapPin, Calendar, Info } from 'lucide-react';
import { tapAPI, zoneAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Taps() {
    const [taps, setTaps] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [t, z] = await Promise.all([tapAPI.getAll(), zoneAPI.getAll()]);
            setTaps(t.data.taps || []); setZones(z.data.zones || []);
        } catch { toast.error('Failed to load taps'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (t) => {
        setEditing(t);
        ['name', 'zone_id', 'location_description', 'status', 'installed_date']
            .forEach(f => setValue(f, t[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) { await tapAPI.update(editing.id, data); toast.success('Tap updated'); }
            else { await tapAPI.create(data); toast.success('Tap created'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await tapAPI.delete(deleting.id);
            toast.success('Tap deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete tap'); }
    };

    const filtered = taps.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.zone_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Tap Network"
                description="Manage and monitor public water access points across the distribution network."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Provision New Tap
                    </button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Filter by tap name or zone..." 
                        className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200" 
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Droplets size={12} className="text-navy-900 dark:text-gold-500" />
                    Active Access Points: <span className="text-navy-950 dark:text-gold-400 ml-1">{taps.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Network...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Droplets} title="No Taps Found"
                    description="The tap network is currently empty. Define a new public access point to begin monitoring."
                    action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Add Tap Point</button>} />
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
                                    <th className="text-left py-5 px-6">Tap Specification</th>
                                    <th className="text-left py-5 px-6 hidden sm:table-cell">Zone Allocation</th>
                                    <th className="text-left py-5 px-6 hidden md:table-cell">Location Notes</th>
                                    <th className="text-center py-5 px-6">Operational Status</th>
                                    <th className="py-5 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                <AnimatePresence>
                                    {filtered.map((tap, i) => (
                                        <motion.tr 
                                            key={tap.id}
                                            initial={{ opacity: 0, x: -10 }} 
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.02 }} 
                                            className="table-row group"
                                        >
                                            <td className="py-5 px-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-navy-900 group-hover:text-white dark:group-hover:bg-gold-500 dark:group-hover:text-navy-950 transition-all duration-300">
                                                        <Droplets size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-[14px] font-black text-navy-950 dark:text-white leading-tight">
                                                            {tap.name}
                                                        </p>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                            ID: TAP-{tap.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden sm:table-cell">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={12} className="text-slate-300" />
                                                    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                                        {tap.zone_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-5 px-6 hidden md:table-cell">
                                                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                                    {tap.location_description || <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">No Descriptor</span>}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6 text-center">
                                                <span className={tap.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                                                    {tap.status}
                                                </span>
                                            </td>
                                            <td className="py-5 px-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button onClick={() => openEdit(tap)}
                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button onClick={() => setDeleting(tap)}
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
                title={editing ? 'Revise Tap Configuration' : 'Provision New Tap Point'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <label className="label">Unit Designation *</label>
                            <input {...register('name', { required: 'Name is required' })}
                                className="input" placeholder="e.g. Lower Market Tap A" />
                            {errors.name && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="label">Allocation Sector *</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('zone_id', { required: 'Zone is required' })} className="input pl-11">
                                    <option value="">Select allocation sector...</option>
                                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="label">Operational Status</label>
                            <select {...register('status')} className="input">
                                <option value="active">Operational</option>
                                <option value="inactive">Decoupled</option>
                                <option value="maintenance">Maintenance Cycle</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Installation Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('installed_date')} type="date" className="input pl-11" />
                            </div>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Locality Descriptor</label>
                            <div className="relative">
                                <Info size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('location_description')} className="input pl-11"
                                    placeholder="e.g. Opposite community hall, North entrance" />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : editing ? 'Commit Specs' : 'Authorize Provisioning'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke Provisioning" size="sm">
                <div className="p-4 space-y-6 text-center">
                    <div className="p-5 rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            Confirm revocation of provisioning for:<br/>
                            <span className="text-lg font-black block mt-2">{deleting?.name}</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 font-black uppercase tracking-widest text-[11px]">Abort</button>
                        <button onClick={confirmDelete} className="btn-danger flex-1 font-black uppercase tracking-widest text-[11px]">Confirm Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}