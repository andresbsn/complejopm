const pool = require('../config/db');

const JugadorModel = {
    async create(data) {
        const { nombre, telefono, email, categoria_id } = data;
        const catId = categoria_id === '' ? null : categoria_id;
        const query = `
            INSERT INTO jugadores (nombre, telefono, email, categoria_id)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await pool.query(query, [nombre, telefono, email, catId]);
        return result.rows[0];
    },

    async update(id, data) {
        const { nombre, telefono, email, categoria_id, activo } = data;
        const catId = categoria_id === '' ? null : categoria_id;
        const query = `
            UPDATE jugadores 
            SET nombre = COALESCE($1, nombre), telefono = COALESCE($2, telefono),
                email = COALESCE($3, email), categoria_id = COALESCE($4, categoria_id),
                activo = COALESCE($5, activo)
            WHERE id = $6
            RETURNING *
        `;
        const result = await pool.query(query, [
            nombre === undefined ? null : nombre,
            telefono === undefined ? null : telefono,
            email === undefined ? null : email,
            catId === undefined ? null : catId,
            activo === undefined ? null : activo,
            id
        ]);
        return result.rows[0];
    },

    async getAll(includeInactive = false, inactiveOnly = false) {
        const query = `
            SELECT j.*, c.descripcion as categoria_descripcion,
            COALESCE(SUM(CASE WHEN m.tipo = 'DEBE' THEN m.monto ELSE -m.monto END), 0) as saldo
            FROM jugadores j
            LEFT JOIN categorias c ON j.categoria_id = c.id
            LEFT JOIN movimientos_cuenta m ON j.id = m.jugador_id
            WHERE (
                ($1 = TRUE AND $2 = FALSE)
                OR ($1 = FALSE AND $2 = TRUE AND j.activo = FALSE)
                OR ($1 = FALSE AND $2 = FALSE AND j.activo = TRUE)
            )
            GROUP BY j.id, c.descripcion
            ORDER BY j.nombre ASC
        `;
        const result = await pool.query(query, [includeInactive, inactiveOnly]);
        return result.rows;
    },

    async search(termino, includeInactive = false, inactiveOnly = false) {
        const query = `
            SELECT j.*, c.descripcion as categoria_descripcion 
            FROM jugadores j
            LEFT JOIN categorias c ON j.categoria_id = c.id
            WHERE j.nombre ILIKE $1
              AND (
                  ($2 = TRUE AND $3 = FALSE)
                  OR ($2 = FALSE AND $3 = TRUE AND j.activo = FALSE)
                  OR ($2 = FALSE AND $3 = FALSE AND j.activo = TRUE)
              )
            ORDER BY j.nombre ASC 
            LIMIT 10
        `;
        const result = await pool.query(query, [`%${termino}%`, includeInactive, inactiveOnly]);
        return result.rows;
    },

    async delete(id) {
        const activity = await pool.query(`
            SELECT
                EXISTS (SELECT 1 FROM movimientos_cuenta WHERE jugador_id = $1) AS tiene_movimientos,
                EXISTS (SELECT 1 FROM inscripciones WHERE jugador_id = $1) AS tiene_inscripciones
        `, [id]);
        const { tiene_movimientos, tiene_inscripciones } = activity.rows[0];
        if (tiene_movimientos || tiene_inscripciones) {
            const error = new Error('No se puede eliminar un jugador con actividad relacionada. Puede inhabilitarlo.');
            error.status = 409;
            throw error;
        }

        const result = await pool.query('DELETE FROM jugadores WHERE id = $1 RETURNING id', [id]);
        return result.rows[0];
    }
};

module.exports = JugadorModel;
