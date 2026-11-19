import React, { useState, useEffect } from 'react';
import { ProductoService, ProveedorService } from '../services/api';
import { alerts } from '../utils/alerts';

const ProductoForm = ({ productToEdit, onSuccess, onCancel }) => {
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState('bebida');
    const [precio, setPrecio] = useState(''); // Precio Venta
    const [costo, setCosto] = useState('');
    const [stock, setStock] = useState('');
    const [stockMinimo, setStockMinimo] = useState('');
    const [proveedorId, setProveedorId] = useState('');
    const [estado, setEstado] = useState('ACTIVO');
    
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProveedores();
    }, []);

    useEffect(() => {
        if (productToEdit) {
            setNombre(productToEdit.nombre);
            setCategoria(productToEdit.categoria);
            setPrecio(productToEdit.precio);
            setCosto(productToEdit.costo || '');
            setStock(productToEdit.stock);
            setStockMinimo(productToEdit.stock_minimo || '');
            setProveedorId(productToEdit.proveedor_id || '');
            setEstado(productToEdit.estado || 'ACTIVO');
        } else {
            resetForm();
        }
    }, [productToEdit]);

    const fetchProveedores = async () => {
        try {
            const data = await ProveedorService.getAll();
            setProveedores(data);
        } catch (error) {
            console.error('Error fetching proveedores:', error);
        }
    };

    const resetForm = () => {
        setNombre('');
        setCategoria('bebida');
        setPrecio('');
        setCosto('');
        setStock('');
        setStockMinimo('');
        setProveedorId('');
        setEstado('ACTIVO');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = { 
                nombre, 
                categoria, 
                precio: parseFloat(precio), 
                costo: parseFloat(costo) || 0,
                stock: parseInt(stock) || 0,
                stock_minimo: parseInt(stockMinimo) || 0,
                proveedor_id: proveedorId ? parseInt(proveedorId) : null,
                estado
            };

            if (productToEdit) {
                await ProductoService.update(productToEdit.id, data);
            } else {
                await ProductoService.create(data);
            }

            resetForm();
            if (onSuccess) onSuccess();
            alerts.toast('success', productToEdit ? 'Producto actualizado' : 'Producto creado');
        } catch (err) {
            alerts.error('Error', err.message || 'No se pudo guardar el producto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-1">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
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
            
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                    {/* Nombre - Colspan 2 */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                        <input
                            type="text" required value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="ui-input"
                        />
                    </div>
                    
                    {/* Categoria */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoría</label>
                        <select
                            value={categoria} onChange={(e) => setCategoria(e.target.value)}
                            className="ui-input"
                        >
                            <option value="bebida">Bebida</option>
                            <option value="snack">Snack</option>
                            <option value="comida">Comida</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>

                    {/* Estado */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <select
                            value={estado} onChange={(e) => setEstado(e.target.value)}
                            className="ui-input"
                        >
                            <option value="ACTIVO">Activo</option>
                            <option value="INACTIVO">Inactivo</option>
                        </select>
                    </div>

                    {/* Precio Venta */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Precio Venta</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number" step="0.01" required value={precio}
                                onChange={(e) => setPrecio(e.target.value)}
                                className="ui-input pl-7"
                            />
                        </div>
                    </div>

                    {/* Costo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Costo</label>
                        <div className="relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number" step="0.01" value={costo}
                                onChange={(e) => setCosto(e.target.value)}
                                className="ui-input pl-7"
                            />
                        </div>
                    </div>

                    {/* Stock */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Actual</label>
                        <input
                            type="number" value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="ui-input"
                        />
                    </div>

                    {/* Stock Minimo */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Stock Mínimo</label>
                        <input
                            type="number" value={stockMinimo}
                            onChange={(e) => setStockMinimo(e.target.value)}
                            className="ui-input"
                        />
                    </div>

                    {/* Proveedor - Colspan 2 */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor</label>
                        <select
                            value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}
                            className="ui-input"
                        >
                            <option value="">-- Seleccionar Proveedor --</option>
                            {proveedores.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Gestiona los proveedores desde el botón "Gestionar Proveedores" arriba.</p>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                    {productToEdit && (
                        <button
                            type="button" onClick={onCancel}
                            className="ui-secondary-button"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="submit" disabled={loading}
                        className="ui-primary-button"
                    >
                        {loading ? 'Guardando...' : (productToEdit ? 'Actualizar Producto' : 'Guardar Producto')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductoForm;
