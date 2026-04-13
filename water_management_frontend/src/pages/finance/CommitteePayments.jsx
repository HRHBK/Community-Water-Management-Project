import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, CreditCard, Search } from 'lucide-react';
import { committeePaymentAPI, committeeAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

const PAYMENT_TYPES = ['salary', 'allowance', 'bonus', 'reimbursement', 'other'];

export default function CommitteePayments() {
    const [payments, setPayments] = useState([]);
    const [committee, setCommittee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [p, c] = await Promise.all([committeePaymentAPI.getAll(), committeeAPI.getAll()]);
            setPayments(p.data.payments || []);
            setCommittee(c.data.committee || []);
        } catch { toast.error('Failed to load committee payments'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        try {
            await committeePaymentAPI.create(data);
            toast.success('Payment recorded');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const filtered = payments.filter(p =>
        `${p.member_name} ${p.payment_type} ${p.role}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <PageHeader
                title="Committee Payments"
                description="Record payments made to committee members"
                action={
                    <button onClick={() => { reset(); setModal(true); }}
                        className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Record Payment
                    </button>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search payments..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={CreditCard} title="No committee payments"
                        description="Record the first committee payment." />
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left px-4 py-3">Member</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Type</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                                    <th className="text-right px-4 py-3">Amount (FCFA)</th>
                                    <th className="text-left px-4 py-3 hidden lg:table-cell">Method</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <motion.tr key={p.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }} className="table-row">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900 dark:text-white">{p.member_name}</p>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{p.role}</p>
                                        </td>
                                        <td className="px-4 py-3 hidden sm:table-cell">
                                            <span className="badge-active capitalize">{p.payment_type}</span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden md:table-cell">
                                            {p.payment_date}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">
                                            {Number(p.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 capitalize hidden lg:table-cell">
                                            {p.payment_method?.replace('_', ' ')}
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <Modal open={modal} onClose={() => setModal(false)} title="Record Committee Payment" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Committee Member *</label>
                            <select {...register('committee_member_id', { required: 'Required' })} className="input">
                                <option value="">Select member</option>
                                {committee.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.first_name} {c.last_name} — {c.role}
                                    </option>
                                ))}
                            </select>
                            {errors.committee_member_id && <p className="text-xs text-red-500 mt-1">{errors.committee_member_id.message}</p>}
                        </div>
                        <div>
                            <label className="label">Payment Type *</label>
                            <select {...register('payment_type', { required: 'Required' })} className="input">
                                <option value="">Select type</option>
                                {PAYMENT_TYPES.map(t => <option key={t} value={t} className="capitalize">{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="label">Amount (FCFA) *</label>
                            <input {...register('amount', { required: 'Required', min: 1 })}
                                type="number" className="input" />
                        </div>
                        <div>
                            <label className="label">Payment Date *</label>
                            <input {...register('payment_date', { required: 'Required' })}
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
                        <div>
                            <label className="label">Reference</label>
                            <input {...register('reference_number')} className="input" placeholder="Optional" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Description</label>
                            <textarea {...register('description')} rows={2} className="input resize-none" />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Saving...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}