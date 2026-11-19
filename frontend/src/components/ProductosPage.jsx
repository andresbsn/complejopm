import React, { useState, useEffect } from 'react';
import ProductoList from './ProductoList';
import ProductoForm from './ProductoForm';
import { ProductoService, ProveedorService } from '../services/api';
import { alerts } from '../utils/alerts';
import PageHeader from './PageHeader';
import Modal from './Modal';

const ProductosPage = () => {
    // Data State
    const [productos, setProductos] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('');
    const [filterProveedor, setFilterProveedor] = useState('');
    const [filterEstado, setFilterEstado] = useState('ACTIVO'); // Default active

    // Modal State
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [productToEdit, setProductToEdit] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [prodData, provData] = await Promise.all([
                ProductoService.getAll(),
                ProveedorService.getAll()
            ]);
            setProductos(prodData);
            setProveedores(provData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product) => {
        setProductToEdit(product);
        setIsProductModalOpen(true);
    };

    const handleDelete = async (id) => {
        const producto = productos.find(p => p.id === id);
        if (!producto) return;
        
        const nuevoEstado = producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
        const accionTerm = nuevoEstado === 'INACTIVO' ? 'inactivar' : 'reactivar';
        const tituloAction = nuevoEstado === 'INACTIVO' ? 'Inactivar' : 'Reactivar';
        
        const result = await alerts.confirm(`¿${tituloAction} producto?`, `¿Estás seguro de que deseas ${accionTerm} el producto "${producto.nombre}"?`);
        if (!result.isConfirmed) return;
        
        try {
            await ProductoService.update(id, {
                ...producto,
                estado: nuevoEstado
            });
            fetchData();
            alerts.toast('success', `Producto ${nuevoEstado === 'ACTIVO' ? 'reactivado' : 'inactivado'}`);
        } catch (error) {
            alerts.error('Error', `Error al ${accionTerm}: ` + error.message);
        }
    };

    const handleFormSuccess = () => {
        setIsProductModalOpen(false);
        setProductToEdit(null);
        fetchData();
    };

    const handleFormCancel = () => {
        setIsProductModalOpen(false);
        setProductToEdit(null);
    };

    // Filter Logic
    const filteredProductos = productos.filter(p => {
        const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategoria = filterCategoria ? p.categoria === filterCategoria : true;
        const matchesProveedor = filterProveedor ? p.proveedor_id == filterProveedor : true;
        const matchesEstado = filterEstado ? p.estado === filterEstado : true; 
        
        return matchesSearch && matchesCategoria && matchesProveedor && matchesEstado;
    });

    const categorias = [...new Set(productos.map(p => p.categoria))].filter(Boolean);

    return (
        <div className="space-y-6">
            {/* Header & Actions */}
            <PageHeader
                title="Inventario de productos"
                description="Gestioná productos, stock y proveedores."
                actions={
                    <button
                        onClick={() => { setProductToEdit(null); setIsProductModalOpen(true); }}
                        className="ui-primary-button"
                    >
                        <span aria-hidden="true">+</span> Nuevo producto
                    </button>
                }
            />

            {/* Filters Bar */}
            <div className="ui-card grid grid-cols-1 gap-4 p-4 md:grid-cols-4">
                <div className="col-span-1 md:col-span-1">
                    <input
                        type="text"
                        placeholder="🔍 Buscar producto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="ui-input"
                    />
                </div>
                <div>
                     <select 
                        value={filterCategoria} 
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        className="ui-input cursor-pointer"
                    >
                        <option value="">Todas las Categorías</option>
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div>
                    <select 
                        value={filterProveedor} 
                        onChange={(e) => setFilterProveedor(e.target.value)}
                        className="ui-input cursor-pointer"
                    >
                        <option value="">Todos los Proveedores</option>
                        {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                </div>
                <div>
                    <select 
                        value={filterEstado} 
                        onChange={(e) => setFilterEstado(e.target.value)}
                        className="ui-input cursor-pointer"
                    >
                        <option value="">Todos los Estados</option>
                        <option value="ACTIVO">Activos</option>
                        <option value="INACTIVO">Inactivos</option>
                    </select>
                </div>
            </div>

            {/* Product List */}
            {loading ? (
                <div className="ui-card p-10 text-center text-sm text-slate-500">Cargando inventario...</div>
            ) : (
                <ProductoList 
                    productos={filteredProductos} 
                    onEdit={handleEdit} 
                    onDelete={handleDelete}
                />
            )}

            {/* Product Modal */}
            <Modal
                open={isProductModalOpen}
                onClose={handleFormCancel}
                title={productToEdit ? 'Editar producto' : 'Nuevo producto'}
                description="Completá la información del producto y su disponibilidad."
                size="xl"
            >
                <ProductoForm
                    productToEdit={productToEdit}
                    onSuccess={handleFormSuccess}
                    onCancel={handleFormCancel}
                />
            </Modal>
        </div>
    );
};

export default ProductosPage;
