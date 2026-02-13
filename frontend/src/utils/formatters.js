export const formatCurrency = (value) => {
    if (value === undefined || value === null) return '0,00';
    return new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true
    }).format(value);
};
