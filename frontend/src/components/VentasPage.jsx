import React, { useState } from 'react';
import VentaForm from './VentaForm';
import VentaList from './VentaList';
import PageHeader from './PageHeader';

const VentasPage = () => {
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const handleVentaCreated = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Ventas" description="Registrá ventas y consultá el movimiento de la cantina." />
            <div className="ui-card p-6">
                <h2 className="mb-4 text-xl font-extrabold tracking-tight text-slate-900">Registrar venta</h2>
                <VentaForm onVentaCreated={handleVentaCreated} />
            </div>
            <div className="ui-card p-6">
                <VentaList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    );
};

export default VentasPage;
