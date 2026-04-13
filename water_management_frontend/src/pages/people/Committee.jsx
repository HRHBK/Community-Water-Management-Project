import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, UserCheck, Search } from 'lucide-react';
import { committeeAPI, memberAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const ROLES = ['chairperson', 'treasurer', 'secretary', 'member'];

export default function Committee() {
    const [committee, setCommittee] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [c, m] = await Promise.all([committeeAPI.getAll(), memberAPI.getAll()]);
            setCommittee(c.data.committee || []);
            setMembers(m.data.members || []);
        } catch { toast.error('Failed to load committee'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (c) => {
        setEditing(c);
        ['member_id', 'role', 'start_date', 'end_date', 'is_active']
            .forEach(f => setValue(f, c[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) { await committeeAPI.update(editing.id, data); toast.success('Updated'); }
            else { await committeeAPI.create(data); toast.success('Added to committee'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await committeeAPI.delete(deleting.id);
            toast.success('Removed from committee'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot remove'); }
    };

    const filtered = committee.filter(c =>
        `${c.first_name} ${c.last_name} ${c.role}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <PageHeader
                title="Committee Members"
                description="Manage the water committee"
                action={
                    <button onClick={openCreate} className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Add Member
                    </button>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search committee..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={UserCheck} title="No committee members"
                        description="Add members to the committee."
                        action={<button onClick={openCreate} className="btn-primary flex items-center gap-2"><Plus size={14} />Add Member</button>} />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((c, i) => (
                            <motion.div key={c.id}
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.05 }} className="card p-5">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                                            <span className="text-sm font-bold text-navy-700 dark:text-gold-400">
                                                {c.first_name?.[0]}{c.last_name?.[0]}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                                {c.first_name} {c.last_name}
                                            </p>
                                            <p className="text-xs capitalize text-gold-600 dark:text-gold-400 font-medium">
                                                {c.role}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(c)}
                                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-700">
                                            <Pencil size={14} className="text-gray-500 dark:text-gray-400" />
                                        </button>
                                        <button onClick={() => setDeleting(c)}
                                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                                            <Trash2 size={14} className="text-red-400" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1 text-xs text-gray-500 dark:text-gray-300">
                                    {c.phone && <p>📞 {c.phone}</p>}
                                    {c.start_date && <p>Since: {c.start_date}</p>}
                                    <span className={c.is_active ? 'badge-active' : 'badge-inactive'}>
                                        {c.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            <Modal open={modal} onClose={() => setModal(false)}
                title={editing ? 'Edit Committee Member' : 'Add to Committee'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Community Member *</label>
                            <select {...register('member_id', { required: 'Required' })} className="input">
                                <option value="">Select member</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                ))}
                            </select>
                            {errors.member_id && <p className="text-xs text-red-500 mt-1">{errors.member_id.message}</p>}
                        </div>
                        <div>
                            <label className="label">Role *</label>
                            <select {...register('role', { required: 'Required' })} className="input">
                                <option value="">Select role</option>
                                {ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                            </select>
                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
                        </div>
                        <div>
                            <label className="label">Start Date</label>
                            <input {...register('start_date')} type="date" className="input" />
                        </div>
                        <div>
                            <label className="label">End Date</label>
                            <input {...register('end_date')} type="date" className="input" />
                        </div>
                        <div className="flex items-center gap-3">
                            <input type="checkbox" {...register('is_active')} id="is_active"
                                className="w-4 h-4 accent-navy-900" defaultChecked />
                            <label htmlFor="is_active" className="text-sm text-gray-700 dark:text-gray-300">
                                Currently active
                            </label>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Saving...' : editing ? 'Update' : 'Add to Committee'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Remove from Committee" size="sm">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Remove <strong>{deleting?.first_name} {deleting?.last_name}</strong> from the committee?
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleting(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={confirmDelete} className="btn-danger flex-1">Remove</button>
                </div>
            </Modal>
        </div>
    );
}