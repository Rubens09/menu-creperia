const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');  // Necesario para manejar rutas
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const port = 3000;

const ordenesRouter = require('./routes/ordenes');

// Middleware de CORS
app.use(cors());
app.use(express.json());  // Para manejar solicitudes JSON

// Sirve archivos estáticos desde la carpeta 'public'
app.use(express.static(path.join(__dirname, '../public')));  // <- Importante! Apunta a la carpeta 'public' correctamente.
app.get('/success', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'success.html')); // Asegúrate de usar la ruta correcta
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'login.html')); // Asegúrate de usar la ruta correcta
});
// Ruta para obtener los datos del catálogo desde Supabase
app.get('/api/catalogo', async (req, res) => {
    /*try {
        console.log("1");
        // Consultar la tabla 'catalogo'
        const { data, error } = await supabase
            .from('categorias')
            .select('*');

        if (error) {
            // Si hay un error en la consulta
            return res.status(500).json({ error: error.message });
        }

        res.json(data);  // Enviar los datos obtenidos en formato JSON
    } catch (error) {
        res.status(500).json({ error: error.message });
    }*/
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
         catalogo["Complemento"] = complementoMap;/*[{ COMPLEMENTO: complementoMap }];*/
       }
   
       // 3. Devolver el JSON
       res.json(catalogo);
     } catch (err) {
       console.error('Error obteniendo catálogo:', err);
       res.status(500).json({ error: 'Error en el servidor' });
     }
});

app.use('/api', ordenesRouter);

// Iniciar el servidor en el puerto 3000
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});

// Ruta para crear una sesión de pago en Stripe
app.post('/create-checkout-session', async (req, res) => {
    try {
        const { itemsParaStripe } = req.body;
        const origin = req.headers.origin || '/';
        if (!itemsParaStripe || itemsParaStripe.length === 0) {
            return res.status(400).json({ error: 'No items provided' });
        }

        // Crear la sesión de pago en Stripe
        const id="";
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: itemsParaStripe.map(item => ({
                price_data: {
                    currency: 'MXN',  // Cambia a la moneda de tu preferencia
                    product_data: {
                        name: item.name,
                    },
                    unit_amount: item.price * 100,  // El precio debe ser en centavos
                },
                quantity: item.quantity,
            })),
            mode: 'payment',
            success_url: origin+'/success?id='+itemsParaStripe[0].id,
            cancel_url: origin+'/cancel',
        });
        res.json({ id: session.id });
    } catch (err) {
        console.error('Error creando la sesión de pago:', err);
        res.status(500).send('Error al crear la sesión de pago');
    }
});
app.post('/api/verificar-pago', async (req, res) => {
  const cod=generarCodigoEntrega();
  const { id } = req.body; // Este es el ID de Supabase, no de Stripe

  if (!id) {
    return res.status(400).json({ error: 'ID de orden requerido' });
  }

  try {
    // Paso 1: Buscar orden por ID en Supabase
    const { data: orden, error } = await supabase
      .from('ordenes')
      .select('stripe_session_id, pagado,fecha_entrega,codigo_entrega')
      .eq('id', id)
      .single();

    if (error || !orden) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }
    // Si ya está pagado, no volver a consultar Stripe
    if (orden.pagado && orden.fecha_entrega!=null && orden.codigo_entrega) {
      return res.json({ pagado: true ,codigo_entrega:orden.codigo_entrega,fecha_entrega:orden.fecha_entrega});
    }
    console.log("session:"+id);
    console.log("session stripe:"+orden.stripe_session_id);

    // Paso 2: Verificar el pago en Stripe
    const session = await stripe.checkout.sessions.retrieve(orden.stripe_session_id);

    if (session.payment_status === 'paid') {
      // Paso 3: Actualizar la orden en Supabase
      const { error: updateError } = await supabase
        .from('ordenes')
        .update({ pagado: true ,codigo_entrega: cod})
        .eq('id', id);

      if (updateError) {
        console.error('Error actualizando Supabase:', updateError.message);
        return res.status(500).json({ error: 'Error actualizando orden como pagada' });
      }

      return res.json({ pagado: true ,codigo_entrega:cod});
    } else {
      return res.json({ pagado: false });
    }
  } catch (err) {
    console.error('Error al verificar el pago:', err.message);
    res.status(500).json({ error: 'Error al verificar el pago' });
  }
});
const generarCodigoEntrega = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let codigo = '';
  for (let i = 0; i < length; i++) {
    codigo += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return codigo;
};
app.post('/api/actualizar-hora-entrega', async (req, res) => {
  const { id, hora } = req.body;

  if (!id || !hora) {
    return res.status(400).json({ error: 'Faltan datos: id u hora' });
  }

  // Obtener la fecha actual en México
  const fecha = new Date().toLocaleDateString('en-CA', {
    timeZone: 'America/Mexico_City' // formato YYYY-MM-DD
  });

  const fechaEntrega = `${fecha}T${hora}:00`;

  try {
    const { data, error } = await supabase
      .from('ordenes')
      .update({ fecha_entrega: fechaEntrega })
      .eq('id', id)
      .select('codigo_entrega, fecha_entrega')
      .single();

    if (error) {
      console.error('Error actualizando fecha_entrega:', error.message);
      return res.status(500).json({ error: 'No se pudo actualizar la fecha de entrega' });
    }

    res.json({
      mensaje: 'Hora de entrega actualizada',
      fecha_entrega: data.fecha_entrega,
      codigo_entrega: data.codigo_entrega
    });
  } catch (err) {
    console.error('Error general:', err.message);
    res.status(500).json({ error: 'Error inesperado' });
  }
});
app.get('/api/stripe-public-key', (req, res) => {
  res.json({ publicKey: process.env.STRIPE_PUBLIC_KEY });
});