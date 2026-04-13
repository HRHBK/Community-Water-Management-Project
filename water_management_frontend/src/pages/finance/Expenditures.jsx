import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, ReceiptText, Search, Tag } from 'lucide-react';
import { expenditureAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Expenditures() {
    const [expenditures, setExpenditures] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [catModal, setCatModal] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
    const catForm = useForm();

    const load = async () => {
        try {
            const [e, c] = await Promise.all([expenditureAPI.getAll(), expenditureAPI.getCategories()]);
            setExpenditures(e.data.expenditures || []);
            setCategories(c.data.categories || []);
        } catch { toast.error('Failed to load expenditures'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        try {
            await expenditureAPI.create(data);
            toast.success('Expenditure recorded');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const onCreateCategory = async (data) => {
        try {
            await expenditureAPI.createCategory(data);
            toast.success('Category created');
            setCatModal(false); catForm.reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const filtered = expenditures.filter(e =>
        `${e.description} ${e.category_name}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <PageHeader
                title="Expenditures"
                description="Track all operational expenditures"
                action={
                    <div className="flex gap-2">
                        <button onClick={() => setCatModal(true)} className="btn-secondary flex items-center gap-2">
                            <Tag size={14} /> Category
                        </button>
                        <button onClick={() => { reset(); setModal(true); }}
                            className="btn-primary flex items-center gap-2">
                            <Plus size={16} /> Add Expense
                        </button>
                    </div>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search expenditures..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="No expenditures found"
                        description="Record the first expenditure." />
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left px-4 py-3">Description</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Category</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                                    <th className="text-right px-4 py-3">Amount (FCFA)</th>
                                    <th className="text-left px-4 py-3 hidden lg:table-cell">Approved By</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((e, i) => (
                                    <motion.tr key={e.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }} className="table-row">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {e.description}
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="badge-active">{e.category_name}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden md:table-cell">
                                            {e.expenditure_date}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                                            {Number(e.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden lg:table-cell">
                                            {e.approved_by_name || '—'}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <Modal open={modal} onClose={() => setModal(false)} title="Record Expenditure" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">Description *</label>
                            <input {...register('description', { required: 'Required' })} className="input" />
                            {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description.message}</p>}
                        </div>
                        <div>
                            <label className="label">Category *</label>
                            <select {...register('category_id', { required: 'Required' })} className="input">
                                <option value="">Select category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            {errors.category_id && <p className="text-xs text-red-500 mt-1">{errors.category_id.message}</p>}
                        </div>
                        <div>
                            <label className="label">Amount (FCFA) *</label>
                            <input {...register('amount', { required: 'Required', min: 1 })}
                                type="number" className="input" />
                        </div>
                        <div>
                            <label className="label">Date *</label>
                            <input {...register('expenditure_date', { required: 'Required' })}
                                type="date" className="input"
                                defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Payment Method</label>
                            <select {...register('payment_method')} className="input">
                                <option value="cash">Cash</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Notes</label>
                            <textarea {...register('notes')} rows={2} className="input resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Saving...' : 'Record Expenditure'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal open={catModal} onClose={() => setCatModal(false)} title="Create Category" size="sm">
                <form onSubmit={catForm.handleSubmit(onCreateCategory)} className="space-y-4">
                    <div>
                        <label className="label">Category Name *</label>
                        <input {...catForm.register('name', { required: 'Required' })} className="input" />
                    </div>
                    <div>
                        <label className="label">Description</label>
                        <input {...catForm.register('description')} className="input" />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setCatModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Create</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}