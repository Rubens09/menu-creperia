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
router.get('/listar_ordenes', async (req, res) => {
    try {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
  
      const finDia = new Date();
      finDia.setHours(23, 59, 59, 999);
  
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        //.gte('fecha_entrega', inicioDia.toISOString())
        //.lte('fecha_entrega', finDia.toISOString())
        .eq('pagado', true)
        .or('preparado.is.null,preparado.eq.false')
        .order('fecha_entrega', { ascending: false });
  
      if (error) {
        console.error('❌ Error al obtener órdenes:', error);
        return res.status(500).json({ error: 'Error al obtener órdenes' });
      }
  
      res.json(data);
    } catch (err) {
      console.error('❌ Error del servidor:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
});
router.patch('/preparar-item/:id', async (req, res) => {
    const idItem = req.params.id;
  
    const { error } = await supabase
      .from('ordenes')
      .update({ preparado: true })
      .eq('id', idItem);
  
    if (error) {
      console.error('❌ Error al actualizar ítem:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el estado del ítem' });
    }
  
    res.json({ success: true });
});
//--vista de entrega
router.get('/listar_entregas', async (req, res) => {
    try {
      const inicioDia = new Date();
      inicioDia.setHours(0, 0, 0, 0);
  
      const finDia = new Date();
      finDia.setHours(23, 59, 59, 999);
  
      const { data, error } = await supabase
        .from('ordenes')
        .select('*')
        //.gte('fecha_entrega', inicioDia.toISOString())
        //.lte('fecha_entrega', finDia.toISOString())
        .eq('pagado', true)
        .eq('preparado',true)
        .or('entregado.is.null,entregado.eq.false')
        .order('fecha_entrega', { ascending: false });
  
      if (error) {
        console.error('❌ Error al obtener órdenes:', error);
        return res.status(500).json({ error: 'Error al obtener órdenes' });
      }
  
      res.json(data);
    } catch (err) {
      console.error('❌ Error del servidor:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
});
router.patch('/entregar-item/:id', async (req, res) => {
    const idItem = req.params.id;
  
    const { error } = await supabase
      .from('ordenes')
      .update({ preparado: true })
      .eq('id', idItem);
  
    if (error) {
      console.error('❌ Error al actualizar ítem:', error);
      return res.status(500).json({ error: 'No se pudo actualizar el estado del ítem' });
    }
  
    res.json({ success: true });
});  

module.exports = router;