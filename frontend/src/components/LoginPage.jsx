import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../../assets/logo.jpg';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError('Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-4 py-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(99,102,241,.34),_transparent_40%),radial-gradient(circle_at_bottom_left,_rgba(124,58,237,.24),_transparent_35%)]" />
            <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-white p-6 shadow-2xl sm:p-8">
                <div className="mb-8 text-center">
                    <div className="mx-auto h-28 w-28 overflow-hidden rounded-3xl bg-slate-950 shadow-xl shadow-indigo-950/20 ring-4 ring-indigo-50">
                        <img src={logo} alt="Logo de PM Padel" className="h-full w-full object-cover object-center" />
                    </div>
                    <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">PM Padel</h1>
                    <p className="mt-2 text-sm text-slate-500">Ingresá para gestionar tu complejo</p>
                </div>

                {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="login-username">Usuario</label>
                        <input id="login-username" type="text" autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} className="ui-input" required />
                    </div>
                    <div>
                        <label className="mb-1.5 block text-sm font-semibold text-slate-700" htmlFor="login-password">Contraseña</label>
                        <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="ui-input" required />
                    </div>
                    <button type="submit" disabled={loading} className="ui-primary-button w-full">
                        {loading ? 'Ingresando...' : 'Ingresar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
