import React, { useState, useRef } from 'react';
import ProductoList from './ProductoList';
import ProductoForm from './ProductoForm';

const ProductosPage = () => {
    const [productToEdit, setProductToEdit] = useState(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const formRef = useRef(null);

    const handleEdit = (product) => {
        setProductToEdit(product);
        // Scroll to form
        formRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSuccess = () => {
        setProductToEdit(null);
        setRefreshTrigger(prev => prev + 1); // Trigger list refresh
    };

    const handleCancelEdit = () => {
        setProductToEdit(null);
    };

    return (
        <div className="space-y-6">
            <div ref={formRef} className="bg-white p-6 rounded-lg shadow-sm">
                <ProductoForm 
                    productToEdit={productToEdit} 
                    onSuccess={handleSuccess}
                    onCancel={handleCancelEdit}
                />
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
                <ProductoList 
                    onEdit={handleEdit} 
                    refreshTrigger={refreshTrigger}
                />
            </div>
        </div>
    );
};

export default ProductosPage;
