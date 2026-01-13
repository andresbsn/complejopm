import React, { useState, useEffect } from 'react';
import { ProductoService, VentaService, JugadorService } from '../services/api';
import SearchableSelect from './SearchableSelect';

const VentaForm = ({ onVentaCreated }) => {
    const [productos, setProductos] = useState([]);
    const [carrito, setCarrito] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [mensaje, setMensaje] = useState(null);
    const [metodoPago, setMetodoPago] = useState('efectivo');
    const [jugadores, setJugadores] = useState([]);
    const [selectedJugador, setSelectedJugador] = useState(null);

    useEffect(() => {
        cargarProductos();
        cargarJugadores();
    }, []);

    const cargarJugadores = async () => {
        try {
            const data = await JugadorService.getAll();
            setJugadores(data);
        } catch (error) {
            console.error('Error al cargar jugadores:', error);
        }
    };

    const cargarProductos = async () => {
        try {
            // Only load active products for sales
            const data = await ProductoService.getAll({ estado: 'ACTIVO' });
            setProductos(data);
        } catch (error) {
            console.error('Error al cargar productos:', error);
        }
    };

    const agregarAlCarrito = (producto) => {
        if (producto.stock <= 0) return;

        const itemExistente = carrito.find(item => item.producto_id === producto.id);
        
        if (itemExistente) {
            if (producto.stock < itemExistente.cantidad + 1) {
                alert('No hay suficiente stock');
                return;
            }
            setCarrito(carrito.map(item => 
                item.producto_id === producto.id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCarrito([...carrito, {
                producto_id: producto.id,
                nombre: producto.nombre,
                precio_unitario: parseFloat(producto.precio),
                cantidad: 1
            }]);
        }
    };

    const actualizarCantidad = (productoId, nuevaCantidad) => {
        if (nuevaCantidad < 1) return;
        
        const producto = productos.find(p => p.id === productoId);
        if (!producto) return;

        if (producto.stock < nuevaCantidad) {
            alert('No hay suficiente stock');
            return;
        }

        setCarrito(carrito.map(item => 
            item.producto_id === productoId 
                ? { ...item, cantidad: nuevaCantidad }
                : item
        ));
    };

    const eliminarDelCarrito = (productoId) => {
        setCarrito(carrito.filter(item => item.producto_id !== productoId));
    };

    const calcularTotal = () => {
        return carrito.reduce((total, item) => total + (item.precio_unitario * item.cantidad), 0);
    };

    const finalizarVenta = async () => {
        if (carrito.length === 0) return;

        setLoading(true);
        try {
            if (metodoPago === 'cuenta_corriente' && !selectedJugador) {
                alert('Debe seleccionar un jugador para cargar a la cuenta corriente');
                setLoading(false);
                return;
            }

            const ventaData = {
                items: carrito,
                total: calcularTotal(),
                metodo_pago: metodoPago,
                jugador_id: metodoPago === 'cuenta_corriente' ? selectedJugador.id : null
            };
            await VentaService.create(ventaData);
            setMensaje({ type: 'success', text: 'Venta realizada con éxito' });
            setCarrito([]);
            setMetodoPago('efectivo');
            setSelectedJugador(null);
            cargarProductos(); // Recargar para actualizar stock
            if (onVentaCreated) onVentaCreated();
            setTimeout(() => setMensaje(null), 3000);
        } catch (error) {
            console.error('Error al realizar venta:', error);
            setMensaje({ type: 'error', text: 'Error al realizar la venta' });
        } finally {
            setLoading(false);
        }
    };

    const filteredProductos = productos.filter(p => 
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) && p.stock > 0
    );

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-6">
            {/* Left Column: Product Catalog */}
            <div className="w-full md:w-2/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Buscar productos..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredProductos.map(producto => (
                            <button
                                key={producto.id}
                                onClick={() => agregarAlCarrito(producto)}
                                disabled={producto.stock <= 0}
                                className={`flex flex-col items-start p-4 rounded-lg border transition-all duration-200 text-left ${
                                    producto.stock > 0 
                                        ? 'border-gray-200 hover:border-indigo-500 hover:shadow-md bg-white' 
                                        : 'border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed'
                                }`}
                            >
                                <div className="w-full flex justify-between items-start mb-2">
                                    <span className="font-semibold text-gray-800 line-clamp-1">{producto.nombre}</span>
                                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                        producto.stock > 10 ? 'bg-green-100 text-green-800' : 
                                        producto.stock > 0 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {producto.stock}
                                    </span>
                                </div>
                                <div className="text-indigo-600 font-bold text-lg">${producto.precio}</div>
                                <div className="text-xs text-gray-500 mt-1 capitalize">{producto.categoria}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right Column: Cart/Ticket */}
            <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-800">Ticket de Venta</h2>
                    <span className="text-sm text-gray-500">{carrito.length} items</span>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {carrito.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <span className="text-4xl mb-2">🛒</span>
                            <p>El carrito está vacío</p>
                        </div>
                    ) : (
                        carrito.map(item => (
                            <div key={item.producto_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg group">
                                <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.nombre}</h4>
                                    <div className="text-sm text-gray-500">${item.precio_unitario} x {item.cantidad}</div>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <div className="flex items-center bg-white rounded-md border border-gray-200">
                                        <button 
                                            onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-l-md"
                                        >
                                            -
                                        </button>
                                        <span className="px-2 text-sm font-medium">{item.cantidad}</span>
                                        <button 
                                            onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                                            className="px-2 py-1 text-gray-600 hover:bg-gray-100 rounded-r-md"
                                        >
                                            +
                                        </button>
                                    </div>
                                    <div className="text-right min-w-[60px]">
                                        <div className="font-semibold text-gray-900">${(item.precio_unitario * item.cantidad).toFixed(2)}</div>
                                        <button 
                                            onClick={() => eliminarDelCarrito(item.producto_id)}
                                            className="text-xs text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100">
                    {mensaje && (
                        <div className={`mb-3 p-2 text-sm rounded-md text-center ${mensaje.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {mensaje.text}
                        </div>
                    )}
                    
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Método de Pago</label>
                        <select
                            value={metodoPago}
                            onChange={(e) => setMetodoPago(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            <option value="efectivo">Efectivo</option>
                            <option value="transferencia">Transferencia</option>
                            <option value="qr">QR</option>
                            <option value="cuenta_corriente">Cuenta Corriente</option>
                        </select>
                    </div>

                    {metodoPago === 'cuenta_corriente' && (
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Cliente / Jugador</label>
                            <SearchableSelect
                                options={jugadores}
                                value={selectedJugador ? selectedJugador.id : ''}
                                onChange={(option) => setSelectedJugador(option)}
                                labelKey="nombre"
                                valueKey="id"
                                placeholder="Buscar Jugador..."
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Se registrará una deuda en la cuenta del jugador seleccionado.
                            </p>
                        </div>
                    )}

                    <div className="flex justify-between items-center mb-4">
                        <span className="text-gray-600">Total a Pagar</span>
                        <span className="text-2xl font-bold text-gray-900">${calcularTotal().toFixed(2)}</span>
                    </div>
                    <button 
                        onClick={finalizarVenta}
                        disabled={carrito.length === 0 || loading}
                        className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Procesando...' : 'Cobrar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VentaForm;
