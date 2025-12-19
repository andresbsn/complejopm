import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
    const { user } = useAuth();
    const isAdmin = user?.rol === 'admin';

    const allModules = [
        {
            name: 'Reservas Padel',
            path: '/reservas/padel',
            icon: '🎾',
            color: 'bg-blue-500',
            description: 'Gestionar turnos de Padel'
        },
        {
            name: 'Reservas Fútbol',
            path: '/reservas/futbol',
            icon: '🥅',
            color: 'bg-green-500',
            description: 'Gestionar turnos de Fútbol'
        },
        {
            name: 'Jugadores',
            path: '/jugadores',
            icon: '👥',
            color: 'bg-indigo-500',
            description: 'Administrar base de clientes'
        },
        {
            name: 'Ventas',
            path: '/ventas',
            icon: '💰',
            color: 'bg-yellow-500',
            description: 'Registrar ventas de kiosco'
        },
        {
            name: 'Productos',
            path: '/productos',
            icon: '📦',
            color: 'bg-orange-500',
            description: 'Gestionar inventario'
        },
        {
            name: 'Canchas',
            path: '/canchas',
            icon: '⚽',
            color: 'bg-teal-500',
            description: 'Configurar canchas',
            adminOnly: true
        },
        {
            name: 'Configuración',
            path: '/configuracion',
            icon: '⚙️',
            color: 'bg-gray-500',
            description: 'Ajustes del sistema',
            adminOnly: true
        }
    ];

    const modules = allModules.filter(module => !module.adminOnly || isAdmin);

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Panel de Control</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {modules.map((module) => (
                    <Link 
                        key={module.name} 
                        to={module.path}
                        className="block group"
                    >
                        <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 h-full">
                            <div className="p-6 flex items-center space-x-4">
                                <div className={`p-4 rounded-lg text-white text-2xl ${module.color} bg-opacity-90 group-hover:bg-opacity-100 transition-colors`}>
                                    {module.icon}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{module.name}</h2>
                                    <p className="text-gray-500 text-sm mt-1">{module.description}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                <span className="text-indigo-600 font-medium text-sm group-hover:underline">Acceder</span>
                                <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;
