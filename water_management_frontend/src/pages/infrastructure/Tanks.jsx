import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Droplets, Search, MapPin, Zap, Info } from 'lucide-react';
import { tankAPI, zoneAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Tanks() {
    const [tanks, setTanks] = useState([]);
    const [zones, setZones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [t, z] = await Promise.all([tankAPI.getAll(), zoneAPI.getAll()]);
            setTanks(t.data.tanks || []);
            setZones(z.data.zones || []);
        } catch { toast.error('Failed to load tanks'); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (t) => {
        setEditing(t);
        ['name', 'zone_id', 'capacity_litres', 'current_level', 'location_description', 'status']
            .forEach(f => setValue(f, t[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) { await tankAPI.update(editing.id, data); toast.success('Tank updated'); }
            else { await tankAPI.create(data); toast.success('Tank created'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await tankAPI.delete(deleting.id);
            toast.success('Tank deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete tank'); }
    };

    const filtered = tanks.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.zone_name?.toLowerCase().includes(search.toLowerCase())
    );

    const getLevelColor = (pct) =>
        pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-gold-500' : 'bg-rose-500';

    return (
        <div className="space-y-8">
            <PageHeader
                title="Water Storage"
                description="Real-time telemetry and management of the community water reservoirs."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Install Reservoir
                    </button>
                }
            />

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96 group">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="Search by tank ID or location..." 
                        className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200" 
                    />
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400">
                    <Zap size={12} className="text-emerald-500 animate-pulse" />
                    System Capacity: <span className="text-navy-950 dark:text-gold-400 ml-1">
                        {tanks.reduce((acc, t) => acc + Number(t.capacity_litres), 0).toLocaleString()} L
                    </span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Querying Telemetry...</p>
                </div>
            ) : filtered.length === 0 ? (
                <EmptyState icon={Droplets} title="No Reservoirs Detected"
                    description="Your infrastructure map is empty. Register a water storage tank to start monitoring levels."
                    action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Add Tank</button>} />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <AnimatePresence>
                        {filtered.map((tank, i) => {
                            const pct = Math.round((tank.current_level / tank.capacity_litres) * 100);
                            const statusColor = tank.status === 'active' ? 'emerald' : tank.status === 'maintenance' ? 'amber' : 'slate';
                            
                            return (
                                <motion.div 
                                    key={tank.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="stat-card p-6 flex flex-col gap-6"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl bg-${statusColor}-500/10 flex items-center justify-center text-${statusColor}-600 dark:text-${statusColor}-400`}>
                                                <Droplets size={24} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-navy-950 dark:text-white tracking-tight">{tank.name}</h3>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <MapPin size={10} className="text-slate-300" />
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tank.zone_name}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => openEdit(tank)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => setDeleting(tank)}
                                                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Advanced Level Indicator */}
                                    <div className="p-4 rounded-[1.8rem] bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                                        <div className="flex justify-between items-end mb-3 px-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Current Depth</span>
                                            <span className={`text-lg font-black text-${statusColor}-600 dark:text-${statusColor}-400`}>{pct}%</span>
                                        </div>
                                        <div className="h-3 bg-white dark:bg-black/20 rounded-full overflow-hidden relative border border-slate-100 dark:border-white/5">
                                            <motion.div 
                                                initial={{ width: 0 }} 
                                                animate={{ width: `${pct}%` }}
                                                transition={{ duration: 1.5, ease: "circOut" }}
                                                className={`h-full rounded-full ${getLevelColor(pct)} shadow-lg relative`}
                                            >
                                                <div className="absolute top-0 right-0 h-full w-4 bg-gradient-to-r from-transparent to-white/20" />
                                            </motion.div>
                                        </div>
                                        <div className="flex justify-between text-[11px] font-bold mt-3 text-slate-500 dark:text-slate-400 px-1">
                                            <span>{Number(tank.current_level).toLocaleString()} L</span>
                                            <span className="opacity-40">M: {Number(tank.capacity_litres).toLocaleString()} L</span>
                                        </div>
                                    </div>

                                    {/* Action Footnotes */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full bg-${statusColor}-500 animate-pulse`} />
                                            <span className={`text-[10px] font-black uppercase tracking-widest text-${statusColor}-600/80`}>{tank.status}</span>
                                        </div>
                                        {tank.location_description && (
                                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/50 dark:bg-white/5 text-[10px] font-bold text-slate-400">
                                                <Info size={10} />
                                                Locality Verified
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}

            {/* Create/Edit Modal */}
            <Modal open={modal} onClose={() => setModal(false)}
                title={editing ? 'Revise Reservoir Specs' : 'Install New Reservoir'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <label className="label">Unit Designation *</label>
                            <input {...register('name', { required: 'Name is required' })}
                                className="input" placeholder="e.g. Reservoir Alpha-1" />
                        </div>
                        <div>
                            <label className="label">Geographic Sector *</label>
                            <select {...register('zone_id', { required: 'Zone is required' })} className="input">
                                <option value="">Select allocation sector...</option>
                                {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Operational Capacity (L) *</label>
                            <div className="relative">
                                <input {...register('capacity_litres', { required: true, min: 1 })}
                                    type="number" className="input pr-12" placeholder="50000" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">LITRES</span>
                            </div>
                        </div>
                        <div>
                            <label className="label">Live Measurement (L) *</label>
                            <div className="relative">
                                <input {...register('current_level', { required: true, min: 0 })}
                                    type="number" className="input pr-12" placeholder="35000" />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300 uppercase tracking-widest whitespace-nowrap">LITRES</span>
                            </div>
                        </div>
                        <div>
                            <label className="label">System Status</label>
                            <select {...register('status')} className="input">
                                <option value="active">Operational</option>
                                <option value="inactive">Decoupled</option>
                                <option value="maintenance">Maintenance Cycle</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Local Coordinates/Address</label>
                            <input {...register('location_description')} className="input"
                                placeholder="e.g. Elevated plain, Sector B" />
                        </div>
                    </div>
                    <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Discard</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : editing ? 'Commit Specs' : 'Finalize Installation'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Decommission Unit" size="sm">
                <div className="p-4 space-y-6 text-center">
                    <div className="p-5 rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            Confirm decommissioning of:<br/>
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