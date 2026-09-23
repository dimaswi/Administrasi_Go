import React, { useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';

import { Button, Input, Label } from '../components/ui/ui';
import AppLogoIcon from '../components/AppLogoIcon';

function InputError({ message }: { message?: string }) {
  return message ? (
    <p className="text-sm text-red-600">{message}</p>
  ) : null;
}

export default function Login() {
    const [nip, setNip] = useState('');
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState('');
    const [errors, setErrors] = useState<{nip?: string, password?: string}>({});
    
    const navigate = useNavigate();

    const panelRef = useRef<HTMLDivElement>(null);
    const mouseX = useMotionValue(-1000);
    const mouseY = useMotionValue(-1000);

    const dotMask = useTransform(
        [mouseX, mouseY],
        ([x, y]: number[]) =>
            `radial-gradient(180px circle at ${x}px ${y}px, black 0%, transparent 100%)`
    );

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        mouseX.set(e.clientX - rect.left);
        mouseY.set(e.clientY - rect.top);
    };

    const handleMouseLeave = () => {
        mouseX.set(-1000);
        mouseY.set(-1000);
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});
        setStatus('');
        
        try {
            const response = await api.post('/auth/login', { nip, password });
            localStorage.setItem('token', response.data.token);
            // Use window.location.href instead of navigate to force a full app reload
            // This ensures AuthContext fetches the new user and permissions from /auth/me
            window.location.href = '/dashboard';
        } catch (err: any) {
            setErrors({
                nip: err.response?.data?.error || 'Failed to login. Please check your credentials.'
            });
            setPassword('');
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="flex h-dvh">
            {/* Left Panel */}
            <div
                ref={panelRef}
                className="relative hidden lg:flex lg:w-[55%] flex-col bg-[#0f0f0f] text-white overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
            >
                {/* Base dots — dim */}
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.18) 1.5px, transparent 1.5px)`,
                        backgroundSize: '48px 48px',
                    }}
                />

                {/* Glow dots — bright violet, masked to mouse proximity */}
                <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        backgroundImage: `radial-gradient(circle, rgba(167,139,250,1) 2.5px, transparent 2.5px)`,
                        backgroundSize: '48px 48px',
                        maskImage: dotMask,
                        WebkitMaskImage: dotMask,
                    }}
                />

                {/* Logo */}
                <div className="relative z-10 flex items-center gap-2.5 p-8">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10">
                        <AppLogoIcon className="size-5 fill-white" />
                    </div>
                    <span className="text-base font-semibold tracking-wide">Administrasi</span>
                </div>

                {/* Main Text */}
                <div className="relative z-10 flex flex-col justify-center flex-1 px-12 pb-16">
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    >
                        <h1 className="text-5xl font-bold leading-tight tracking-tight">
                            Sistem<br />
                            <span className="text-violet-400">Administrasi</span><br />
                            Terpadu
                        </h1>
                        <p className="mt-5 text-sm text-white/50">
                            Klinik Rawat Inap Utama Muhammadiyah<br />Kedungadem
                        </p>
                    </motion.div>
                </div>

                {/* Footer */}
                <div className="relative z-10 px-8 pb-6">
                    <p className="text-xs text-white/30"> 2026 Administrasi</p>
                </div>
            </div>

            {/* Right Panel */}
            <div className="flex flex-1 flex-col items-center justify-center bg-white px-8">
                <motion.div
                    className="w-full max-w-sm"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: 'easeOut', delay: 0.1 }}
                >
                    {/* Mobile logo */}
                    <div className="flex items-center gap-2 mb-8 lg:hidden">
                        <AppLogoIcon className="size-7 fill-black" />
                        <span className="font-bold text-lg text-slate-800">Administrasi</span>
                    </div>

                    <h2 className="text-2xl font-bold text-gray-900">Selamat datang</h2>
                    <p className="mt-1.5 text-sm text-gray-500">
                        Masukkan kredensial untuk mengakses akun anda
                    </p>

                    {status && (
                        <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-700">
                            {status}
                        </div>
                    )}

                    <form className="mt-8 flex flex-col gap-5" onSubmit={submit}>
                        <div className="grid gap-1.5">
                            <Label htmlFor="nip" className="text-sm font-medium text-gray-700">
                                NIP / Email
                            </Label>
                            <Input
                                id="nip"
                                type="text"
                                required
                                autoFocus
                                tabIndex={1}
                                autoComplete="nip"
                                value={nip}
                                onChange={(e) => setNip(e.target.value)}
                                placeholder="Nomor Induk Kepegawaian"
                                className="h-11 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                            />
                            <InputError message={errors.nip} />
                        </div>

                        <div className="grid gap-1.5">
                            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                                Password
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                required
                                tabIndex={2}
                                autoComplete="current-password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder=""
                                className="h-11 border-gray-200 bg-gray-50 focus:bg-white transition-colors"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <Button
                            type="submit"
                            className="mt-2 h-11 w-full bg-gray-900 hover:bg-gray-800 text-white font-medium"
                            tabIndex={3}
                            disabled={processing}
                        >
                            {processing
                                ? <LoaderCircle className="h-4 w-4 animate-spin" />
                                : 'Sign In'
                            }
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
