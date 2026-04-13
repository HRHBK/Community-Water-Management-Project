import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Trash2, Settings, Search, ShieldCheck } from 'lucide-react';
import { userAPI, memberAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [deleting, setDeleting] = useState(null);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [u, m] = await Promise.all([userAPI.getAll(), memberAPI.getAll()]);
            setUsers(u.data.users || []);
            setMembers(m.data.members?.filter(m => m.is_representative) || []);
        } catch { toast.error('Failed to load users'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        try {
            await userAPI.create(data);
            toast.success('User created');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed to create user'); }
    };

    const confirmDelete = async () => {
        try {
            await userAPI.delete(deleting.id);
            toast.success('User deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete user'); }
    };

    const filtered = users.filter(u =>
        `${u.username} ${u.email} ${u.role}`
            .toLowerCase().includes(search.toLowerCase())
    );

    const roleColors = {
        system_admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
        zonal_admin: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        representative: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    };

    return (
        <div>
            <PageHeader
                title="User Management"
                description="Manage system users and access"
                action={
                    <button onClick={() => { reset(); setModal(true); }}
                        className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Add User
                    </button>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search users..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={ShieldCheck} title="No users found"
                        description="Create the first system user."
                        action={<button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2"><Plus size={14} />Add User</button>} />
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left px-4 py-3">Username</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                                    <th className="text-left px-4 py-3">Role</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Status</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((u, i) => (
                                    <motion.tr key={u.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }} className="table-row">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-navy-900 dark:bg-gold-500 flex items-center justify-center">
                                                    <span className="text-xs font-bold text-white dark:text-navy-950">
                                                        {u.username?.[0]?.toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{u.username}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                                            {u.email || '—'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || ''}`}>
                                                {u.role?.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 hidden md:table-cell">
                                            <span className={u.is_active ? 'badge-active' : 'badge-inactive'}>
                                                {u.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => setDeleting(u)}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 float-right">
                                                <Trash2 size={14} className="text-red-400" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <Modal open={modal} onClose={() => setModal(false)} title="Create New User" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Username *</label>
                            <input {...register('username', { required: 'Required' })} className="input" />
                            {errors.username && <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>}
                        </div>
                        <div>
                            <label className="label">Password *</label>
                            <input {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 characters' } })}
                                type="password" className="input" placeholder="Minimum 8 characters" />
                            {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>}
                        </div>
                        <div>
                            <label className="label">Email</label>
                            <input {...register('email')} type="email" className="input" />
                        </div>
                        <div>
                            <label className="label">Role *</label>
                            <select {...register('role', { required: 'Required' })} className="input">
                                <option value="">Select role</option>
                                <option value="system_admin">System Admin</option>
                                <option value="zonal_admin">Zonal Admin</option>
                                <option value="representative">Representative</option>
                            </select>
                            {errors.role && <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Linked Representative (optional)</label>
                            <select {...register('member_id')} className="input">
                                <option value="">None</option>
                                {members.map(m => (
                                    <option key={m.id} value={m.id}>{m.first_name} {m.last_name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Creating...' : 'Create User'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Delete User" size="sm">
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">
                    Delete user <strong>{u.username}</strong>?
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setDeleting(null)} className="btn-secondary flex-1">Cancel</button>
                    <button onClick={confirmDelete} className="btn-danger flex-1">Delete</button>
                </div>
            </Modal>
        </div>
    );
}