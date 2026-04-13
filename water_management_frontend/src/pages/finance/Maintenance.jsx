import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Wrench, Search, ChevronDown, ChevronRight } from 'lucide-react';
import { maintenanceAPI, tankAPI, tapAPI, committeeAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Maintenance() {
    const [works, setWorks] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [taps, setTaps] = useState([]);
    const [committee, setCommittee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [costModal, setCostModal] = useState(null);
    const [expanded, setExpanded] = useState(null);
    const [infraType, setInfraType] = useState('tap');

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const costForm = useForm();

    const load = async () => {
        try {
            const [w, tn, tp, c] = await Promise.all([
                maintenanceAPI.getAll(), tankAPI.getAll(),
                tapAPI.getAll(), committeeAPI.getAll(),
            ]);
            setWorks(w.data.maintenance || []);
            setTanks(tn.data.tanks || []);
            setTaps(tp.data.taps || []);
            setCommittee(c.data.committee || []);
        } catch { toast.error('Failed to load maintenance'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        if (infraType === 'tap') delete data.tank_id; else delete data.tap_id;
        try {
            await maintenanceAPI.create(data);
            toast.success('Maintenance work created');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const onAddCost = async (data) => {
        try {
            await maintenanceAPI.addCost(costModal.id, data);
            toast.success('Cost added');
            setCostModal(null); costForm.reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const filtered = works.filter(w =>
        `${w.title} ${w.infra_name} ${w.status}`
            .toLowerCase().includes(search.toLowerCase())
    );

    const statusColor = (s) => ({
        pending: 'badge-partial', in_progress: 'badge-active',
        completed: 'badge-paid', cancelled: 'badge-inactive',
    }[s] || 'badge-inactive');

    return (
        <div>
            <PageHeader
                title="Maintenance Works"
                description="Track infrastructure maintenance"
                action={
                    <button onClick={() => { reset(); setModal(true); }}
                        className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> New Work
                    </button>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search maintenance works..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={Wrench} title="No maintenance records"
                        description="Log a maintenance work." />
                ) : (
                    <div className="space-y-3">
                        {filtered.map((w, i) => (
                            <motion.div key={w.id}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }} className="card overflow-hidden">
                                <button
                                    onClick={() => setExpanded(expanded === w.id ? null : w.id)}
                                    className="w-full flex items-center justify-between px-5 py-4 text-left">
                                    <div className="flex items-center gap-4">
                                        <div className="w-9 h-9 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                                            <Wrench size={16} className="text-navy-700 dark:text-gold-400" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">{w.title}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-300">
                                                {w.infra_type} — {w.infra_name} · {w.work_date}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className={statusColor(w.status)}>{w.status?.replace('_', ' ')}</span>
                                        {expanded === w.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </div>
                                </button>

                                {expanded === w.id && (
                                    <motion.div
                                        initial={{ height: 0 }} animate={{ height: 'auto' }}
                                        className="border-t border-gray-100 dark:border-navy-700 px-5 py-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Description</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {w.description || '—'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Performed By</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                                    {w.performed_by_name || '—'}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Costs */}
                                        <div className="mb-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cost Items</p>
                                                <button onClick={() => { costForm.reset(); setCostModal(w); }}
                                                    className="text-xs btn-primary py-1 px-3 flex items-center gap-1">
                                                    <Plus size={12} /> Add Cost
                                                </button>
                                            </div>
                                            {w.costs?.length > 0 ? (
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="table-header">
                                                            <th className="text-left px-3 py-2">Description</th>
                                                            <th className="text-right px-3 py-2">Qty</th>
                                                            <th className="text-right px-3 py-2">Unit Cost</th>
                                                            <th className="text-right px-3 py-2">Total</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {w.costs.map(c => (
                                                            <tr key={c.id} className="table-row">
                                                                <td className="px-3 py-2">{c.description}</td>
                                                                <td className="px-3 py-2 text-right">{c.quantity}</td>
                                                                <td className="px-3 py-2 text-right">{Number(c.unit_cost).toLocaleString()}</td>
                                                                <td className="px-3 py-2 text-right font-medium">
                                                                    {Number(c.total_cost).toLocaleString()}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            ) : (
                                                <p className="text-xs text-gray-400 dark:text-gray-500 py-2">No costs recorded yet.</p>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

            {/* Create Modal */}
            <Modal open={modal} onClose={() => setModal(false)} title="Log Maintenance Work" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">Title *</label>
                            <input {...register('title', { required: 'Required' })} className="input"
                                placeholder="e.g. Tap Repair — Main Street" />
                            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
                        </div>
                        <div>
                            <label className="label">Infrastructure Type *</label>
                            <select value={infraType} onChange={e => setInfraType(e.target.value)} className="input">
                                <option value="tap">Public Tap</option>
                                <option value="tank">Water Tank</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">{infraType === 'tap' ? 'Tap' : 'Tank'} *</label>
                            {infraType === 'tap' ? (
                                <select {...register('tap_id', { required: 'Required' })} className="input">
                                    <option value="">Select tap</option>
                                    {taps.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            ) : (
                                <select {...register('tank_id', { required: 'Required' })} className="input">
                                    <option value="">Select tank</option>
                                    {tanks.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                </select>
                            )}
                        </div>
                        <div>
                            <label className="label">Work Date *</label>
                            <input {...register('work_date', { required: 'Required' })} type="date" className="input"
                                defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Status</label>
                            <select {...register('status')} className="input">
                                <option value="pending">Pending</option>
                                <option value="in_progress">In Progress</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Performed By</label>
                            <select {...register('performed_by')} className="input">
                                <option value="">Select committee member</option>
                                {committee.map(c => (
                                    <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.role})</option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Description</label>
                            <textarea {...register('description')} rows={3} className="input resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Saving...' : 'Create Work'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Add Cost Modal */}
            <Modal open={!!costModal} onClose={() => setCostModal(null)} title="Add Cost Item" size="md">
                <form onSubmit={costForm.handleSubmit(onAddCost)} className="space-y-4">
                    <div>
                        <label className="label">Description *</label>
                        <input {...costForm.register('description', { required: 'Required' })}
                            className="input" placeholder="e.g. Pipe fitting, Labor" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="label">Quantity *</label>
                            <input {...costForm.register('quantity', { required: true, min: 1 })}
                                type="number" className="input" />
                        </div>
                        <div>
                            <label className="label">Unit Cost (FCFA) *</label>
                            <input {...costForm.register('unit_cost', { required: true, min: 0 })}
                                type="number" className="input" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setCostModal(null)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Add Cost</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}