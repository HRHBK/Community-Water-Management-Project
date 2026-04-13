import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Waves, Sun, Moon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import toast from 'react-hot-toast';

export default function Login() {
    const { login } = useAuth();
    const { dark, toggle } = useTheme();
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        setLoading(true);
        try {
            const result = await login(data);
            toast.success(`Welcome back, ${result.user.username}!`);
            if (result.must_change_password) {
                toast('Please change your password.', { icon: '⚠️' });
            }
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center p-4">

            {/* Theme toggle */}
            <button
                onClick={toggle}
                className="fixed top-4 right-4 p-2 rounded-xl
                   bg-white dark:bg-navy-800
                   border border-gray-200 dark:border-navy-600
                   hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
            >
                {dark
                    ? <Sun size={18} className="text-gold-400" />
                    : <Moon size={18} className="text-gray-600" />
                }
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="flex flex-col items-center mb-8">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', delay: 0.1 }}
                        className="w-16 h-16 rounded-2xl bg-navy-900 dark:bg-gold-500
                       flex items-center justify-center mb-4 shadow-lg"
                    >
                        <Waves size={30} className="text-white dark:text-navy-950" />
                    </motion.div>
                    <h1 className="text-2xl font-bold text-navy-900 dark:text-white">
                        AquaCam Connect
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Water Management System
                    </p>
                </div>

                {/* Form */}
                <div className="card p-6 shadow-xl">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                        Sign in to your account
                    </h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div>
                            <label className="label">Username or Email</label>
                            <input
                                {...register('username', { required: 'Username is required' })}
                                className="input"
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                            {errors.username && (
                                <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password', { required: 'Password is required' })}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-10"
                                    placeholder="Enter your password"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(p => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2
                             text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Signing in...
                                </>
                            ) : 'Sign In'}
                        </motion.button>
                    </form>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
                    AquaCam Connect &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    );
}