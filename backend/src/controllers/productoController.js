const ProductoModel = require('../models/ProductoModel');

const productoController = {
    getAll: async (req, res) => {
        try {
            const productos = await ProductoModel.getAll();
            res.json(productos);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener los productos' });
        }
    },

    getById: async (req, res) => {
        try {
            const { id } = req.params;
            const producto = await ProductoModel.getById(id);
            if (!producto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(producto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al obtener el producto' });
        }
    },

    create: async (req, res) => {
        try {
            const { nombre, categoria, precio, stock } = req.body;
            if (!nombre || !precio) {
                return res.status(400).json({ error: 'Nombre y precio son requeridos' });
            }
            const newProducto = await ProductoModel.create({ nombre, categoria, precio, stock });
            res.status(201).json(newProducto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al crear el producto' });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, categoria, precio, stock } = req.body;
            const updatedProducto = await ProductoModel.update(id, { nombre, categoria, precio, stock });
            if (!updatedProducto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json(updatedProducto);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al actualizar el producto' });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const deletedProducto = await ProductoModel.delete(id);
            if (!deletedProducto) {
                return res.status(404).json({ error: 'Producto no encontrado' });
            }
            res.json({ message: 'Producto eliminado correctamente', producto: deletedProducto });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Error al eliminar el producto' });
        }
    }
};

module.exports = productoController;
