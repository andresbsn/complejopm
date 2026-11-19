import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './Icon';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const allModules = [
        { name: 'Reservas Pádel', path: '/reservas/padel', icon: 'tennis', color: 'bg-blue-500', description: 'Gestionar turnos de pádel' },
        { name: 'Reservas Fútbol', path: '/reservas/futbol', icon: 'football', color: 'bg-green-500', description: 'Gestionar turnos de fútbol' },
        { name: 'Jugadores', path: '/jugadores', icon: 'users', color: 'bg-indigo-500', description: 'Administrar la base de clientes' },
        { name: 'Ventas', path: '/ventas', icon: 'money', color: 'bg-yellow-500', description: 'Registrar ventas de cantina' },
        { name: 'Caja', path: '/caja', icon: 'cash', color: 'bg-emerald-500', description: 'Controlar ingresos y cierres' },
        { name: 'Reportes', path: '/reportes', icon: 'chart', color: 'bg-violet-500', description: 'Analizar operación y finanzas' },
        { name: 'Torneos', path: '/torneos', icon: 'trophy', color: 'bg-amber-500', description: 'Gestionar competencias' },
        { name: 'Gastos', path: '/gastos', icon: 'money', color: 'bg-rose-500', description: 'Registrar gastos generales' },
        { name: 'Productos', path: '/productos', icon: 'box', color: 'bg-orange-500', description: 'Gestionar inventario', adminOnly: true },
        { name: 'Canchas', path: '/canchas', icon: 'football', color: 'bg-teal-500', description: 'Configurar canchas', adminOnly: true },
        { name: 'Configuración', path: '/configuracion', icon: 'settings', color: 'bg-slate-500', description: 'Ajustes del sistema', adminOnly: true },
    ];

    const modules = allModules.filter(module => !module.adminOnly || isAdmin);

    return (
        <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 p-5 text-white shadow-lg md:p-7">
                <p className="text-sm font-medium text-indigo-100">Centro de operaciones</p>
                <h1 className="mt-1 text-2xl font-bold md:text-3xl">Panel de control</h1>
                <p className="mt-2 max-w-2xl text-sm text-indigo-100">Accedé rápidamente a las tareas más importantes del complejo.</p>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
                {modules.map((module) => (
                    <Link key={module.name} to={module.path} className="group block">
                        <div className="h-full overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                            <div className="flex items-center space-x-3 p-4 md:space-x-4 md:p-6">
                                <div className={`flex shrink-0 items-center justify-center rounded-xl p-3 text-white ${module.color} bg-opacity-90 transition group-hover:bg-opacity-100 md:p-4`}>
                                    <Icon name={module.icon} size={26} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="truncate text-base font-bold text-slate-800 md:text-xl">{module.name}</h2>
                                    <p className="mt-1 line-clamp-2 text-xs text-slate-500 md:text-sm">{module.description}</p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50 px-4 py-2.5 md:px-6">
                                <span className="text-xs font-bold text-indigo-600 group-hover:underline md:text-sm">Abrir módulo</span>
                                <Icon name="arrow" size={17} className="text-slate-400 transition-transform group-hover:translate-x-1" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
