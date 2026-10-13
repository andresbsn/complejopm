const METHODS = new Set(['efectivo', 'debito', 'credito', 'qr', 'transferencia', 'cuenta_corriente', 'gastos_generales']);
const MONETARY_METHODS = new Set(['efectivo', 'debito', 'credito', 'qr', 'transferencia']);
const INSCRIPTION_METHODS = new Set([...MONETARY_METHODS, 'cuenta_corriente']);

class DomainError extends Error {
    constructor(message, status = 400) { super(message); this.status = status; this.name = 'DomainError'; }
}

function money(value, label = 'monto') {
    if (value === '' || value === null || value === undefined || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
        throw new DomainError(`${label} debe ser positivo y tener hasta 2 decimales`);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) throw new DomainError(`${label} debe ser positivo`);
    return number;
}

function nonNegativeMoney(value, label = 'monto') {
    if (value === '' || value === null || value === undefined || !/^\d+(\.\d{1,2})?$/.test(String(value))) {
        throw new DomainError(`${label} no puede ser negativo y debe tener hasta 2 decimales`);
    }
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new DomainError(`${label} no puede ser negativo`);
    return number;
}

function method(value) {
    if (!METHODS.has(value)) throw new DomainError('Método de pago no permitido');
    return value;
}

module.exports = { DomainError, METHODS, MONETARY_METHODS, INSCRIPTION_METHODS, money, nonNegativeMoney, method };
