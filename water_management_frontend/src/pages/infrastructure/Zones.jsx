import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Waves, Search, Building2, Droplets, MapPin, ArrowRight } from 'lucide-react';
import { zoneAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Zones() {
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const { data } = await zoneAPI.getAll();
            setZones(data.zones || []);
        } catch { toast.error('Failed to load zones'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (z) => {
        setEditing(z);
        setValue('name', z.name);
        setValue('description', z.description || '');
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) {
                await zoneAPI.update(editing.id, data);
                toast.success('Zone updated');
            } else {
                await zoneAPI.create(data);
                toast.success('Zone created');
            }
            setModal(false);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Operation failed');
        }
    };

    const confirmDelete = async () => {
        try {
            await zoneAPI.delete(deleting.id);
            toast.success('Zone deleted');
            setDeleting(null);
            load();
        } catch (e) {
            toast.error(e.response?.data?.error || 'Cannot delete zone');
        }
    };

    const filtered = zones.filter(z =>
        z.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Water Zones"
                description="Monitor and manage the geographical water distribution sectors."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Create New Zone
                    </button>
                }
            />

            {/* Premium Search Filter Section */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Filter zones by name..."
                        className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200 focus:border-navy-950/20 dark:focus:border-gold-500/20"
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[11px] font-black uppercase tracking-widest text-slate-400">
                    <MapPin size={12} />
                    Total Active Sectors: <span className="text-navy-950 dark:text-gold-400 ml-1">{zones.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Zonal Data...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState
                    icon={Waves}
                    title="No Zones Identified"
                    description="It seems your infrastructure hasn't been mapped yet. Start by defining your first water distribution zone."
                    action={<button onClick={openCreate} className="btn-primary"><Plus size={16} />Add Zone</button>}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {filtered.map((zone, i) => (
                            <motion.div
                                key={zone.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: i * 0.05, duration: 0.4 }}
                                className="stat-card p-0 group"
                            >
                                {/* Card Header / Top Bar */}
                                <div className="p-6 pb-4">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-navy-900/10 dark:bg-gold-500/10 rounded-2xl blur group-hover:blur-md transition-all duration-300" />
                                                <div className="relative w-14 h-14 rounded-2xl bg-white dark:bg-navy-950 border border-slate-100 dark:border-white/5 flex items-center justify-center shadow-lg group-hover:-translate-y-1 transition-transform duration-300">
                                                    <Waves size={24} className="text-navy-900 dark:text-gold-500" />
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-navy-950 dark:text-white tracking-tight">{zone.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sector ID: {zone.id}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => openEdit(zone)}
                                                className="p-2.5 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-95"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button 
                                                onClick={() => setDeleting(zone)}
                                                className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {zone.description && (
                                        <p className="mt-4 text-[13px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                                            {zone.description}
                                        </p>
                                    )}
                                </div>

                                {/* Stats Strip */}
                                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-white/5 border-t border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 group-hover:bg-white dark:group-hover:bg-black/40 transition-colors">
                                    <div className="p-4 text-center group/stat">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/stat:text-navy-950 dark:group-hover/stat:text-gold-400 transition-colors">Homes</p>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Building2 size={12} className="text-slate-300" />
                                            <p className="text-lg font-black text-navy-950 dark:text-white">{zone.household_count || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 text-center group/stat">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/stat:text-navy-950 dark:group-hover/stat:text-gold-400 transition-colors">Taps</p>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Droplets size={12} className="text-slate-300" />
                                            <p className="text-lg font-black text-navy-950 dark:text-white">{zone.tap_count || 0}</p>
                                        </div>
                                    </div>
                                    <div className="p-4 text-center group/stat">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 group-hover/stat:text-navy-950 dark:group-hover/stat:text-gold-400 transition-colors">Tanks</p>
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <div className="w-3 h-3 rounded bg-navy-950/10 dark:bg-gold-500/20 flex items-center justify-center">
                                                <div className="w-1.5 h-1.5 rounded-full bg-navy-950 dark:bg-gold-500" />
                                            </div>
                                            <p className="text-lg font-black text-navy-950 dark:text-white">{zone.tank_count || 0}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* View Details Overlay/Button */}
                                <div className="p-4 pt-1">
                                    <button className="w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white dark:bg-navy-950 border border-slate-100 dark:border-white/5 hover:border-navy-950/20 dark:hover:border-gold-500/20 text-slate-500 hover:text-navy-950 dark:hover:text-gold-400 font-black text-[11px] uppercase tracking-widest transition-all">
                                        View Sector Vitals
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal open={modal} onClose={() => setModal(false)}
                title={editing ? 'Revise Sector Config' : 'Register New Sector'}>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="label">Sector Designation *</label>
                            <input {...register('name', { required: 'Zone name is required' })}
                                className="input" placeholder="e.g. Northern Highlands" />
                            {errors.name && <p className="text-xs font-bold text-rose-500 mt-2 px-1">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="label">Operational Notes</label>
                            <textarea {...register('description')} rows={4}
                                className="input resize-none" placeholder="Provide geographical or administrative details..." />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-4 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : editing ? 'Commit Changes' : 'Finalize Sector'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Decommission Sector" size="sm">
                <div className="p-4 space-y-6">
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <p className="text-sm font-bold text-rose-700 dark:text-rose-400 text-center leading-relaxed">
                            Warning: Decommissioning <span className="font-black underline decoration-2 underline-offset-4">{deleting?.name}</span> is an irreversible administrative action.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 font-black uppercase tracking-widest text-[11px]">Cancel</button>
                        <button onClick={confirmDelete} className="btn-danger flex-1 font-black uppercase tracking-widest text-[11px]">Confirm Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}