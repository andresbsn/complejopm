const ensureAdmin = (req, res, next) => {
    if (req.user?.rol !== 'admin') {
        return res.status(403).json({ error: 'Solo administradores pueden consultar este reporte.' });
    }
    next();
};

module.exports = { ensureAdmin };
