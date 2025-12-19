import React, { useState, useEffect } from 'react';
import { ProveedorService } from '../services/api';
import CuentaProveedorModal from './CuentaProveedorModal';

const ProveedoresPage = () => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal & Form States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProvider, setEditingProvider] = useState(null);
    const [selectedProviderForAccount, setSelectedProviderForAccount] = useState(null);

    const [formData, setFormData] = useState({ 
        nombre: '', contacto: '', telefono: '', email: '' 
    });

    useEffect(() => {
        fetchProveedores();
    }, []);

    const fetchProveedores = async () => {
        setLoading(true);
        try {
            const data = await ProveedorService.getAll();
            setProveedores(data);
        } catch (error) {
            console.error('Error fetching proveedores:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (prov) => {
        setEditingProvider(prov);
        setFormData({
            nombre: prov.nombre,
            contacto: prov.contacto || '',
            telefono: prov.telefono || '',
            email: prov.email || ''
        });
        setIsFormOpen(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Seguro que desea eliminar este proveedor?')) return;
        try {
            await ProveedorService.delete(id);
            fetchProveedores();
        } catch (error) {
            alert('Error al eliminar proveedor');
        }
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProvider) {
                await ProveedorService.update(editingProvider.id, formData);
            } else {
                await ProveedorService.create(formData);
            }
            setIsFormOpen(false);
            setEditingProvider(null);
            setFormData({ nombre: '', contacto: '', telefono: '', email: '' });
            fetchProveedores();
        } catch (error) {
            alert('Error al guardar proveedor');
        }
    };

    const filteredProveedores = proveedores.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.contacto && p.contacto.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Proveedores</h2>
                    <p className="text-gray-500 text-sm">Gestiona proveedores y sus cuentas corrientes</p>
                </div>
                <button 
                    onClick={() => { setEditingProvider(null); setFormData({ nombre: '', contacto: '', telefono: '', email: '' }); setIsFormOpen(true); }}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 shadow-sm transition-colors"
                >
                    + Nuevo Proveedor
                </button>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <input
                    type="text"
                    placeholder="🔍 Buscar proveedor por nombre o contacto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>

            {/* List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto / Detalles</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Saldo (Deuda)</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr><td colSpan="4" className="text-center py-8">Cargando proveedores...</td></tr>
                            ) : filteredProveedores.length === 0 ? (
                                <tr><td colSpan="4" className="text-center py-8 text-gray-500">No se encontraron proveedores.</td></tr>
                            ) : (
                                filteredProveedores.map((prov) => (
                                    <tr key={prov.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{prov.nombre}</div>
                                            <div className="text-xs text-gray-400">ID: {prov.id}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{prov.contacto || '-'}</div>
                                            <div className="text-xs text-gray-500">{prov.email}</div>
                                            <div className="text-xs text-gray-500">{prov.telefono}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {/* Saldo logic: Positive = We Owe */}
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                parseFloat(prov.saldo) > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                            }`}>
                                                ${parseFloat(prov.saldo || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                            <button 
                                                onClick={() => setSelectedProviderForAccount(prov)}
                                                className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md"
                                            >
                                                Ver Cuenta
                                            </button>
                                            <button 
                                                onClick={() => handleEdit(prov)}
                                                className="text-gray-600 hover:text-gray-900"
                                            >
                                                Editar
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(prov.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create/Edit Modal */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="relative mx-auto p-6 border w-full max-w-lg shadow-lg rounded-xl bg-white">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">
                            {editingProvider ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                        </h3>
                        <form onSubmit={handleFormSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Empresa / Proveedor</label>
                                <input 
                                    type="text" required
                                    value={formData.nombre} onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nombre Contacto</label>
                                <input 
                                    type="text" 
                                    value={formData.contacto} onChange={(e) => setFormData({...formData, contacto: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                                <input 
                                    type="text" 
                                    value={formData.telefono} onChange={(e) => setFormData({...formData, telefono: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email</label>
                                <input 
                                    type="email" 
                                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                />
                            </div>
                            
                            <div className="flex justify-end gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setIsFormOpen(false)}
                                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit"
                                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Account Info Modal */}
            {selectedProviderForAccount && (
                <CuentaProveedorModal 
                    proveedor={selectedProviderForAccount} 
                    onClose={() => {
                        setSelectedProviderForAccount(null);
                        fetchProveedores(); // Refresh to update saldo
                    }}
                />
            )}
        </div>
    );
};

export default ProveedoresPage;
