import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Download, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { subscriptionAPI, paymentAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MySubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(currentYear);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                if (!user?.household_id) return;
                const [s, p] = await Promise.all([
                    subscriptionAPI.getByHousehold(user.household_id),
                    paymentAPI.getBySubscription(user.household_id),
                ]);
                const subs = s.data.subscriptions || [];
                const currentSub = subs.find(s => s.year == year);
                setSubscription(currentSub || null);
                setPayments(p.data.payments?.filter(p => p.year == year) || []);
            } catch { }
            finally { setLoading(false); }
        };
        load();
    }, [year, user]);

    const StatusIcon = () => {
        if (!subscription) return null;
        if (subscription.status === 'paid') return <CheckCircle2 className="text-green-500" size={40} />;
        if (subscription.status === 'partial') return <Clock className="text-yellow-500" size={40} />;
        return <AlertCircle className="text-red-500" size={40} />;
    };

    return (
        <div>
            <PageHeader
                title="My Subscription"
                description="View your household subscription and payment history"
            />

            <div className="flex items-center gap-3 mb-6">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Year:</label>
                <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-28">
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : !subscription ? (
                <div className="card p-8 text-center">
                    <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-300">No subscription found for {year}.</p>
                </div>
            ) : (
                <div className="space-y-4">

                    {/* Status card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="card p-6 flex flex-col sm:flex-row items-center gap-6">
                        <StatusIcon />
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                {subscription.status}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Subscription status for {year}
                            </p>
                        </div>
                        <button
                            onClick={() => window.open(reportAPI.subscriptionStatement(user.household_id, year), '_blank')}
                            className="btn-secondary flex items-center gap-2">
                            <Download size={15} /> Download Statement
                        </button>
                    </motion.div>

                    {/* Details */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }} className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                            Subscription Details
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Members', value: subscription.member_count },
                                { label: 'Rate/Person', value: `FCFA ${Number(subscription.rate_per_person).toLocaleString()}` },
                                { label: 'Amount Due', value: `FCFA ${Number(subscription.amount_due).toLocaleString()}` },
                                { label: 'Amount Paid', value: `FCFA ${Number(subscription.amount_paid || 0).toLocaleString()}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center p-3 bg-gray-50 dark:bg-navy-800 rounded-xl">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                        {subscription.balance > 0 && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                    Outstanding Balance: FCFA {Number(subscription.balance).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Payment history */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }} className="card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-navy-700">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Payment History
                            </h3>
                        </div>
                        {payments.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No payments recorded for {year}.</p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="table-header">
                                        <th className="text-left px-4 py-3">Date</th>
                                        <th className="text-right px-4 py-3">Amount (FCFA)</th>
                                        <th className="text-left px-4 py-3 hidden sm:table-cell">Method</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Reference</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p, i) => (
                                        <tr key={p.id} className="table-row">
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{p.payment_date}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                {Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize hidden sm:table-cell">
                                                {p.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 hidden md:table-cell">
                                                {p.reference_number || '—'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
}