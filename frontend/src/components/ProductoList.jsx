import React, { useState, useEffect } from 'react';
import { ProductoService } from '../services/api';

const ProductoList = ({ onEdit, refreshTrigger }) => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchProductos();
    }, [refreshTrigger]);

    const fetchProductos = async () => {
        try {
            const data = await ProductoService.getAll();
            setProductos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este producto?')) return;

        try {
            await ProductoService.delete(id);
            fetchProductos(); // Recargar la lista
        } catch (err) {
            alert(err.message);
        }
    };

    const filteredProductos = productos.filter(producto => 
        producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        producto.categoria.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div>Cargando productos...</div>;
    if (error) return <div>Error: {error}</div>;

    return (
        <div className="overflow-hidden">
            <div className="mb-4">
                <input
                    type="text"
                    placeholder="Buscar productos por nombre o categoría..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                />
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredProductos.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.categoria}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.precio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        producto.stock > 10 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {producto.stock}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                                    <button 
                                        onClick={() => onEdit(producto)}
                                        className="text-indigo-600 hover:text-indigo-900 transition-colors duration-150"
                                    >
                                        Editar
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(producto.id)}
                                        className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredProductos.length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                        No se encontraron productos.
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductoList;
