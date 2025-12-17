import React, { useState, useEffect } from 'react';
import { ProductoService } from '../services/api';

const ProductoForm = ({ productToEdit, onSuccess, onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('bebida');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (productToEdit) {
            setNombre(productToEdit.nombre);
            setCategoria(productToEdit.categoria);
            setPrecio(productToEdit.precio);
            setStock(productToEdit.stock);
        } else {
            resetForm();
        }
    }, [productToEdit]);

    const resetForm = () => {
        setNombre('');
        setCategoria('bebida');
        setPrecio('');
        setStock('');
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const data = { 
                nombre, 
                categoria, 
                precio: parseFloat(precio), 
                stock: parseInt(stock) || 0 
            };

            if (productToEdit) {
                await ProductoService.update(productToEdit.id, data);
            } else {
                await ProductoService.create(data);
            }

            resetForm();
            if (onSuccess) onSuccess();
            alert(productToEdit ? 'Producto actualizado exitosamente' : 'Producto creado exitosamente');
        } catch (err) {
            setError(err.message || 'Error al guardar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white shadow-sm rounded-xl border border-gray-100 p-6 mb-6">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                    {productToEdit ? 'Editar Producto' : 'Agregar Nuevo Producto'}
                </h3>
                {productToEdit && (
                    <button 
                        onClick={onCancel}
                        className="text-sm text-gray-500 hover:text-gray-700"
                    >
                        Cancelar Edición
                    </button>
                )}
            </div>
            
            {error && <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700">{error}</div>}
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="nombre">
                            Nombre
                        </label>
                        <input
                            id="nombre"
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="categoria">
                            Categoría
                        </label>
                        <select
                            id="categoria"
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                        >
                            <option value="bebida">Bebida</option>
                            <option value="snack">Snack</option>
                            <option value="comida">Comida</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="precio">
                            Precio
                        </label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                id="precio"
                                type="number"
                                step="0.01"
                                value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                className="block w-full rounded-lg border-gray-300 pl-7 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="stock">
                            Stock Inicial
                        </label>
                        <input
                            id="stock"
                            type="number"
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2.5"
                        />
                    </div>
                </div>
                <div className="flex items-center justify-end gap-3">
                    {productToEdit && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {loading ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductoForm;
