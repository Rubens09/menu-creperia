const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');

const router = express.Router();

// Ruta para guardar una orden en Supabase
function generarCodigoEntrega() {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let codigo = '';
    for (let i = 0; i < 6; i++) {
      const indice = Math.floor(Math.random() * caracteres.length);
      codigo += caracteres.charAt(indice);
    }
    return codigo;
}  
router.post('/guardar-orden', async (req, res) => {
    try {
        const { ordenes } = req.body;

        if (!ordenes || !Array.isArray(ordenes) || ordenes.length === 0) {
            return res.status(400).json({ error: 'Items de orden no proporcionados' });
        }

        // Insertar cada ítem como una fila individual
        const datos = ordenes.map(item => ({
            id: item.id,
            stripe_session_id: item.stripe_session_id,
            categoria: item.crepa_tipo,
            subcategoria: item.crepa_subtipo,
            complemento: item.complementos || [],
            precio: item.precio,
            fecha_creacion: new Date().toISOString(),
            pagado: false,
            entregado: false,
            fecha_entrega: null,
            codigo_entrega: generarCodigoEntrega()
        }));

        const { error } = await supabase
            .from('ordenes')
            .insert(datos);

        if (error) {
            console.error('❌ Error al insertar la orden:', error);
            return res.status(500).json({ error: 'No se pudo guardar la orden' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('❌ Error del servidor:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

module.exports = router;