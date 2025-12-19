import React from 'react';

const ProductoList = ({ productos, onEdit, onDelete }) => {
    if (!productos || productos.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow-sm border border-gray-100">
                <p className="text-lg">No se encontraron productos.</p>
                <p className="text-sm">Prueba ajustando los filtros o la búsqueda.</p>
            </div>
        );
    }

    return (
        <div className="overflow-hidden bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Proveedor</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Costo</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                            <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productos.map((producto) => (
                            <tr key={producto.id} className="hover:bg-gray-50 transition-colors duration-150">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{producto.nombre}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.categoria}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{producto.proveedor_nombre || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${producto.costo}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">${producto.precio}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                            producto.stock > producto.stock_minimo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {producto.stock}
                                        </span>
                                        {producto.stock <= producto.stock_minimo && (
                                            <span className="text-xs text-red-500 font-bold" title={`Stock mínimo: ${producto.stock_minimo}`}>⚠</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                        producto.estado === 'ACTIVO' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {producto.estado}
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
                                        onClick={() => onDelete(producto.id)}
                                        className="text-red-600 hover:text-red-900 transition-colors duration-150"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProductoList;
