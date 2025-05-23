const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

// Endpoint para obtener el catálogo
router.get('/catalogo', async (req, res) => {
  try {
    console.log("Hola");
    const catalogo = {};

    // 1. Obtener Categorías
    const { data: categorias, error: categoriasError } = await supabase
      .from('categorias')
      .select('id, nombre')
      .eq('activo', true);

    if (categoriasError) {
      return res.status(500).json({ error: 'Error obteniendo categorías' });
    }

    console.log('Categorías obtenidas:', categorias);  // Agregar console.log aquí para depuración

    // Iterar sobre las categorías para obtener subcategorías e ingredientes
    for (const categoria of categorias) {
      const { data: subcategorias, error: subcategoriasError } = await supabase
        .from('subcategorias')
        .select('id, nombre')
        .eq('categoria_id', categoria.id)
        .eq('activo', true);

      if (subcategoriasError) {
        return res.status(500).json({ error: `Error obteniendo subcategorías para ${categoria.nombre}` });
      }

      console.log(`Subcategorías obtenidas para ${categoria.nombre}:`, subcategorias);  // Depuración

      const subList = [];

      // Iterar sobre las subcategorías para obtener los ingredientes
      for (const sub of subcategorias) {
        const { data: ingredientes, error: ingredientesError } = await supabase
          .from('ingredientes')
          .select('nombre, costo')
          .eq('subcategoria_id', sub.id)
          .eq('activo', true);

        if (ingredientesError) {
          return res.status(500).json({ error: `Error obteniendo ingredientes para ${sub.nombre}` });
        }

        console.log(`Ingredientes obtenidos para ${sub.nombre}:`, ingredientes);  // Depuración

        const ingredientesMap = {};
        for (const ing of ingredientes) {
          ingredientesMap[ing.nombre] = parseFloat(ing.costo);
        }

        subList.push({
          [sub.nombre]: {
            Ingredientes: ingredientesMap
          }
        });
      }

      if (subList.length > 0) {
        catalogo[categoria.nombre] = subList;
      }
    }

    // 2. Obtener Complementos
    const { data: complementos, error: complementosError } = await supabase
      .from('complementos')
      .select('nombre, imagen_url, costo')
      .eq('activo', true);

    if (complementosError) {
      return res.status(500).json({ error: 'Error obteniendo complementos' });
    }

    console.log('Complementos obtenidos:', complementos);  // Depuración

    // Crear un mapa para los complementos
    const complementoMap = {};
    for (const comp of complementos) {
      complementoMap[comp.nombre] = {
        imagen: comp.imagen_url,
        costo: parseFloat(comp.costo)
      };
    }

    // Si hay complementos, agregarlo al catálogo
    if (Object.keys(complementoMap).length > 0) {
      catalogo["Complemento"] = complementoMap;//[{ COMPLEMENTO: complementoMap }];
    }

    // 3. Devolver el JSON
    res.json(catalogo);
  } catch (err) {
    console.error('Error obteniendo catálogo:', err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

module.exports = router;