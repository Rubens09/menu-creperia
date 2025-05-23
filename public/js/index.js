let total=0,subtotal=0,complementos="",totalComplementos=0,pagina_orden=1;
let cont_complemento=1;
let orden_item=[],orden_subitem=[],orden_subitem_cantidad=[],orden_subitem_complemento=[];
let articulo=0;
function calcularTotalOrden(items) {
    return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
}  
$(document).ready(function() {
    $('#loader').hide();
    function generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }
    $(document).on("click", "#terminar_compra", function () {
        const itemVal = $("#slc_item").val();
        const subitemVal = $("#slc_subitem").val();
        const cantidadVal = $("#num_subitem").val();
    
        const itemValido = itemVal && itemVal !== "...";
        const subitemValido = subitemVal && subitemVal !== "...";
    
        // Solo permitir continuar si hay algo previamente en la orden o una nueva selección válida
        if ((Object.keys(orden_item).length > 0) || (itemValido && subitemValido)) {
            $('#loader').show();
    
            // Si hay una selección válida, agregarla a la orden
            if (itemValido && subitemValido) {
                let inner = {};
    
                articulo += parseInt(cantidadVal);
                subtotal += parseFloat($("#total_compra").text());
                $("#articulo_compra").text(articulo);
                $("#subtotal_compra").text(subtotal);
                $("#total_compra").text("0.00");
    
                // Obtener complementos seleccionados
                $('.complementos').each(function () {
                    let complementoId = $(this).attr('id').split('_')[1];
                    let selected = [];
                    $(this).find('.item-complemento:checked').each(function () {
                        let labelText = $(this).siblings('label').text().trim();
                        selected.push(labelText);
                    });
                    if (selected.length > 0) {
                        inner[complementoId] = selected;
                    }
                });
    
                orden_subitem_complemento[pagina_orden] = inner;
                orden_item[pagina_orden] = itemVal;
                orden_subitem[pagina_orden] = subitemVal;
                orden_subitem_cantidad[pagina_orden] = cantidadVal;
            }
    
            let itemsParaStripe = [];
            let ordenesParaGuardar = [];
            const ordenUUID = generateUUID(); // Generador de GUID
    
            for (let id in orden_item) {
                const subitems = Array.isArray(orden_subitem[id]) ? orden_subitem[id].join(',') : orden_subitem[id] || '';
                const cantidad = parseInt(orden_subitem_cantidad[id]) || 1;
                const complementosRaw = orden_subitem_complemento[id] || {};
    
                const complementosSeleccionados = Object.values(complementosRaw);
    
                let precioCrepa = calcularPrecioCrepa(orden_item[id], orden_subitem[id]);
                let precioComplementos = calcularPrecioComplementos(complementosSeleccionados.flat());
                let precioFinal = precioCrepa + precioComplementos;
    
                itemsParaStripe.push({
                    id: ordenUUID,
                    name: `${orden_item[id]} - ${subitems}`,
                    quantity: cantidad,
                    description: complementosSeleccionados.flat().length > 0
                        ? `Complementos: ${complementosSeleccionados.flat().join(', ')}`
                        : '',
                    price: precioFinal
                });
    
                ordenesParaGuardar.push({
                    id: ordenUUID,
                    crepa_tipo: orden_item[id],
                    crepa_subtipo: subitems,
                    complementos: complementosSeleccionados,
                    cantidad,
                    precio: precioFinal
                });
            }
    
            // Crear sesión de Stripe
            $.ajax({
                url: '/create-checkout-session',
                type: 'POST',
                contentType: 'application/json',
                data: JSON.stringify({ itemsParaStripe }),
                success: function (response) {
                    const sessionId = response.id;
                    if (!sessionId) {
                        throw new Error('Stripe no devolvió un session ID');
                    }
    
                    const ordenesConId = ordenesParaGuardar.map(item => ({
                        ...item,
                        stripe_session_id: sessionId
                    }));
    
                    $.ajax({
                        url: '/api/guardar-orden',
                        type: 'POST',
                        contentType: 'application/json',
                        data: JSON.stringify({ ordenes: ordenesConId }),
                        success: function () {
                            fetch('/api/stripe-public-key')
                                .then(res => res.json())
                                .then(data => {
                                    const stripe = Stripe(data.publicKey);
                                    stripe.redirectToCheckout({ sessionId });
                                    //$('#loader').hide();
                                });
                        },
                        error: function (xhr) {
                            console.error('Error al guardar la orden:', xhr.responseText);
                            $('#loader').hide();
                        }
                    });
                },
                error: function (xhr) {
                    console.error('Error al crear sesión de Stripe:', xhr.responseText);
                    $('#loader').hide();
                }
            });
        } else {
            const Toast = Swal.mixin({
                toast: true,
                position: "top-end",
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true,
                didOpen: (toast) => {
                    toast.onmouseenter = Swal.stopTimer;
                    toast.onmouseleave = Swal.resumeTimer;
                }
            });
            Toast.fire({
                icon: "warning",
                title: "Por favor selecciona algún artículo válido."
            });
        }
    });                    
    $(document).on("click", "#add_item", function () {
        let result = {};
        let inner = {};
    
        // Obtener complementos seleccionados y asociarlos a la orden actual
        $('.complementos').each(function () {
            let complementoId = $(this).attr('id').split('_')[1]; // ejemplo: "1"
            let selected = [];
            $(this).find('.item-complemento:checked').each(function () {
                let labelText = $(this).siblings('label').text().trim();
                selected.push(labelText);
            });
            if (selected.length > 0) {
                inner[complementoId] = selected.join(',');
            }
        });
    
        // Asegura que el índice sea consistente para todos los arrays
        orden_subitem_complemento[pagina_orden] = inner;
        orden_item[pagina_orden] = $("#slc_item").val();
        orden_subitem[pagina_orden] = $("#slc_subitem").val();
        orden_subitem_cantidad[pagina_orden] = $("#num_subitem").val();
    
        // Debug
        console.log({
            pagina_orden,
            orden_item,
            orden_subitem,
            orden_subitem_cantidad,
            orden_subitem_complemento
        });
        articulo+=parseInt($("#num_subitem").val());
        subtotal+=parseFloat($("#total_compra").text());
        $("#articulo_compra").text(articulo);
        $("#subtotal_compra").text(subtotal);
        $("#total_compra").text("0.00")
        // Limpiar campos
        $("#slc_item").val("");
        $("#slc_subitem").empty().attr("disabled", true).append("<option>...</option>");
        $("#num_subitem").val(1);
        $("#row_complementos").empty();
    
        // Agregar primer bloque de complementos para la siguiente orden
        const contenido = `
            <div class="col-lg-12 d-flex flex-wrap gap-3 mb-3" style="border-top: 1px dashed #b45c1d;">
                <b>Complementos</b>
            </div>
            <div class="col-lg-12 d-flex flex-wrap gap-3 mb-3 complementos" id="complemento_1">
                ${complementos.replace("text_temp_number", "Crepa 1")}
            </div>`;
        $("#row_complementos").append(contenido);
    
        // Incrementar el contador hasta el final para mantener el índice sincronizado
        pagina_orden++;
    });    
    $(document).on("change", ".form-check-input", function () {
        const precio = parseInt($(this).data("price")) || 0;
        if ($(this).is(":checked")) {
            totalComplementos += precio;
        } else {
            totalComplementos -= precio;
        }
        const $input = $('.cantidad');
        const seleccion = $("#slc_subitem option:selected");
        const precioStr = seleccion.data("price");
        if (precioStr) {
            const precio = parseInt(precioStr.toString().replace("lt_", ""), 10);
            const total = $input.val() * precio;
            $("#total_compra").text((total*10)+totalComplementos);
        } else {
            $("#total_compra").text(totalComplementos);
        }
    });
    $(document).on('click', '.btn-decrement', function () {
        const $input = $(this).siblings('.cantidad');
        const min = parseInt($input.attr('min')) || 1;
        const value = parseInt($input.val()) || 0;
        if (value > min) {
          $input.val(value - 1);
          $("#complemento_"+cont_complemento).remove();
          cont_complemento--;
        }
        const seleccion = $("#slc_subitem option:selected");
        const precioStr = seleccion.data("price");
        if (precioStr) {
            const precio = parseInt(precioStr.toString().replace("lt_", ""), 10);
            const total = $input.val() * precio;
            $("#total_compra").text((total*10)+totalComplementos);
        } else {
            $("#total_compra").text("0");
        }
    });
    $(document).on('click', '.btn-increment', function () {
        const $input = $(this).siblings('.cantidad');
        const max = parseInt($input.attr('max')) || 20;
        const value = parseInt($input.val()) || 0;
        if (value < max) {
            $input.val(value + 1);
        }
        const seleccion = $("#slc_subitem option:selected");
        const precioStr = seleccion.data("price");
        if (precioStr) {
            const precio = parseInt(precioStr.toString().replace("lt_", ""), 10);
            const total = $input.val() * precio;
            $("#total_compra").text((total*10)+totalComplementos);
        } else {
            $("#total_compra").text("0");
        }
        cont_complemento++;
        const contenido = `
        <div class="col-lg-12 d-flex flex-wrap gap-3 mb-3 complementos" id="complemento_`+cont_complemento+`">
            ${complementos.replace("text_temp_number", "Crepa "+cont_complemento)}
        </div>
        `;
        $("#row_complementos").append(contenido);
    });
    $(document).on('change', '#slc_subitem', function () {
        const $input = $('.cantidad');
        const seleccion = $("#slc_subitem option:selected");
        const precioStr = seleccion.data("price");
        if (precioStr) {
            const precio = parseInt(precioStr.toString().replace("lt_", ""), 10);
            const total = $input.val() * precio;
            $("#total_compra").text((total*10)+totalComplementos);
        } else {
            $("#total_compra").text("0");
        }
    });
    $(document).on('change', '#slc_item', function () {
        $('#slc_subitem').empty().append("<option>...</option>");
        $("#total_compra").text("0.00");
        
        const data = JSON.parse(localStorage.getItem('element_item'));
        let op_subitem = "";
        const selectedItem = this.value;
    
        for (const seccion in data) {
            const valor = data[seccion];
            if (Array.isArray(valor)) {
                valor.forEach(item => {
                    for (const nombre in item) {
                        if (nombre === selectedItem) {
                            const contenido = item[nombre];
                            const ingredientes = contenido.Ingredientes;
    
                            for (const ing in ingredientes) {
                                op_subitem += `<option value="${ing}" data-price="lt_${ingredientes[ing] / 10}">${ing} - $${ingredientes[ing]}</option>`;
                            }
                        }
                    }
                });
            }
        }
    
        $("#slc_subitem").append(op_subitem);
        $("#slc_subitem").attr("disabled", false);
    });    
    // Realizar la petición GET para obtener los datos desde la base de datos
    fetch('/api/catalogo')  // Asegúrate de que la URL esté correcta
        .then(response => response.json())  // Parsear la respuesta JSON
        .then(data => {
            //console.log(data);
            // Llamar a la función para recorrer el objeto y generar el HTML
            localStorage.setItem("element_item",JSON.stringify(data));
            recorrerObjeto(transformarCatalogo(data));
        })
        .catch(error => {
            console.error("Error al obtener los datos del catálogo:", error);
    });
    $('#btn_pedido').on('click', function() {
        const data = JSON.parse(localStorage.getItem('element_item'));
        let op_item="";
        for (const seccion in data) {
            const valor = data[seccion];
            if (Array.isArray(valor)) {
                op_item = `<div class="row"><div class="col-lg-4 mb-3"><h6><b>Selecciona una ${seccion.toLowerCase()}:</b></h6></div><div class="col-lg-4 mb-3"></div><div class="col-lg-4 mb-3"><select class="form-control" id="slc_item"><option>...</option>`;
                valor.forEach(item => { 
                    op_item += `<option value="${Object.keys(item)[0]}">${Object.keys(item)[0]}</option>`;
                });
            } else if (typeof valor === "object" && complementos=="") {
                complementos = 'text_temp_number<br><div class="col-lg-12 d-flex flex-wrap gap-3 mb-3 list_complemento">';
                for (const nombre in valor) {
                    const precio = valor[nombre]?.costo ?? 0;
                    //console.log(valor);
                    complementos += `
                    <div class="form-check form-check-inline">
                        <input class="form-check-input item-complemento" type="checkbox" value="${nombre}" id="check_${nombre.replace(" ","_")}" data-price="${precio}">
                        <label class="form-check-label" for="check-${nombre}">
                            ${nombre}
                        </label>
                    </div>`;
                }
                complementos += '</div></div>';
            }
        }
        op_item += `</select></div>
        <div class="col-lg-4 mb-3"><h6><b>Selecciona una opción:</b></h6></div><div class="col-lg-4 mb-3"></div><div class="col-lg-4 mb-3"><select class="form-control" id="slc_subitem" disabled><option>...</option></select></div>
        <div class="col-lg-4 mb-3"><h6><b>Cantidad:</b></h6></div><div class="col-lg-4 mb-3"></div>
        <div class="col-lg-4">
            <div class="input-group" style="max-width: 100%;">
                <button class="btn btn-outline-secondary btn-decrement" type="button">−</button>
                <input type="number" class="form-control text-center cantidad" value="1" min="0" max="100" id="num_subitem" readonly />
                <button class="btn btn-outline-secondary btn-increment" type="button">+</button>
            </div>
        </div>
        <div class="col-lg-12 mb-3" id="div_complementos" style="margin-top:10px;"></div>
        </div>`;
        $("#div_items").html(op_item);
        const contenido = `
        <div class="row" id="row_complementos">
            <div class="col-lg-12 d-flex flex-wrap gap-3 mb-3" style="border-top: 1px dashed #b45c1d;">
            <b>Complementos</b>
            </div>
            <div class="col-lg-12 d-flex flex-wrap gap-3 mb-3 complementos" id="complemento_1">
                ${complementos.replace("text_temp_number", "Crepa 1")}
            </div>
        </div>
        `;
        $("#div_complementos").append(contenido);
    });
});

// Función para recorrer el objeto y generar HTML dinámicamente
const recorrerObjeto = (obj) => {
    let menu_ = "";
    let complemento="";

    // Primero, recorremos el objeto principal
    Object.entries(obj).forEach(([key, value]) => {
        menu_ += `
        <section class="recipe_section layout_padding-top">
            <div class="container">
                <div class="heading_container heading_center">
                    <h2>${key}</h2>
                </div>
                <div class="row crepas-row">`;

        // Ahora, recorremos las subcategorías dentro de cada clave
        if (Array.isArray(value)) {
            value.forEach(subItem => {
                Object.entries(subItem).forEach(([subKey, subValue]) => {
                    if (subKey.toUpperCase() != "COMPLEMENTO") {
                        menu_ += `
                        <div class="col-sm-6 col-md-4 mx-auto crepas-item">
                            <div class="box">
                                <div class="detail-box" style="background-color: #fff5e6;">
                                    <h4>${subKey}</h4>
                                </div>
                                <div class="img-box_">
                                    <div class="ingredient-cost">
                                        <div class="col-lg-6"><p style="margin-left:-50px;"><b>Ingrediente</b></p></div>
                                        <div class="col-lg-6"><p style="margin-right:-50px;"><b>Costo</b></p></div>
                                    </div>`;

                        // Recorremos los elementos de cada subcategoría
                        Object.entries(subValue).forEach(([item, cost]) => {
                            Object.entries(cost).forEach(([item_, cost_]) => {
                                menu_ += `
                                <div class="ingredient-cost">
                                    <div class="col-lg-4"><p>${item_}</p></div>
                                    <div class="col-lg-4"><p>------</p></div>
                                    <div class="col-lg-4"><p>$${cost_.toFixed(2)}</p></div>
                                </div>
                                `;
                            });
                        });

                        menu_ += `
                                </div>
                            </div>
                        </div>
                        `;
                    }
                    else if(subKey.toUpperCase() == "COMPLEMENTO"){
                        Object.entries(subValue).forEach(([item, subvvalue]) => {
                            Object.entries(subvvalue).forEach(([item, cost]) => {
                                complemento+=`
                                <div class="item">
                                    <div class="img-box">
                                        <h7 style="font-size: 20px;font-weight: bold;margin-bottom: 15px;font-family: 'bodoni svtytwo sc itc tt book', sans-serif;font-weight: 400;margin-left:70px;color: #8B4513;">${item}</h7>
                                        <img src="${cost.imagen}" alt="" width="100px;" height="200px;"/>
                                    </div>
                                    <p style="font-size: 15px;font-weight: bold;margin-bottom: 15px;font-weight: 400;margin-left:55px;color: #8B4513;">Costo extra: $${cost.costo.toFixed(2)}</p>
                                </div>
                                `;
                            });
                        });
                        if(complemento!=""){
                            $("#title-complemento").show();
                            $("#items-complemento").show();
                            $("#items-complemento").append(complemento);
                            $(".slider_container").slick({
                                autoplay: true,
                                autoplaySpeed: 10000,
                                speed: 600,
                                slidesToShow: 4,
                                slidesToScroll: 1,
                                pauseOnHover: false,
                                draggable: false,
                                prevArrow: '<button class="slick-prev"> </button>',
                                nextArrow: '<button class="slick-next"></button>',
                                responsive: [{
                                        breakpoint: 991,
                                        settings: {
                                            slidesToShow: 3,
                                            slidesToScroll: 1,
                                            adaptiveHeight: true,
                                        },
                                    },
                                    {
                                        breakpoint: 767,
                                        settings: {
                                            slidesToShow: 3,
                                            slidesToScroll: 1,
                                        },
                                    },
                                    {
                                        breakpoint: 576,
                                        settings: {
                                            slidesToShow: 2,
                                            slidesToScroll: 1,
                                        },
                                    },
                                    {
                                        breakpoint: 420,
                                        settings: {
                                            slidesToShow: 1,
                                            slidesToScroll: 1,
                                        },
                                    }
                                ]
                            });
                        }
                    }
                });
            });
        }

        menu_ += `
                </div>
            </div>
        </section>
        `;
    });

    $("#menu").append(menu_);
};
function transformarCatalogo(data) {
    const resultado = {
        Crepas: [{}]
    };
    // Normalizar crepas
    data.Crepa.forEach(categoria => {
        const [nombre, contenido] = Object.entries(categoria)[0];
        resultado.Crepas[0][nombre.toLowerCase()] = [contenido.Ingredientes];
    });
    // Nuevo manejo del objeto plano de Complemento
    if (data.Complemento) {
        const nuevoComplemento = {};
        for (const [nombre, info] of Object.entries(data.Complemento)) {
            nuevoComplemento[nombre.toLowerCase()] = {
                costo: parseFloat(info.costo.toFixed(2)),
                imagen: info.imagen
            };
        }
        resultado.Crepas[0]["complemento"] = [nuevoComplemento];
    }
    return resultado;
}
function calcularPrecioCrepa(ordenItem, ordenSubitem) {
    let precios = JSON.parse(localStorage.getItem("element_item"));
    console.log(localStorage.getItem("element_item"));

    if (!precios || !precios.Crepa) {
        console.error("No se pudieron cargar los precios desde localStorage.");
        return;
    }
    if (!Array.isArray(ordenSubitem)) {
        ordenSubitem = [ordenSubitem];
    }
    let precioBase = 0;
    // Recorremos el objeto de las crepas
    if (precios.Crepa) {
        precios.Crepa.forEach(crepa => {
            Object.keys(crepa).forEach(tipoCrepa => {
                if (tipoCrepa === ordenItem) {
                    // Buscamos los ingredientes de esa crepa
                    const ingredientes = crepa[tipoCrepa].Ingredientes;
                    ordenSubitem.forEach(subitem => {
                        if (ingredientes[subitem]) {
                            precioBase += ingredientes[subitem];  // Sumamos el precio del ingrediente
                        }
                    });
                }
            });
        });
    }
    console.log("precio base:"+precioBase);
    return precioBase;
}
// Función para calcular el precio de los complementos
function calcularPrecioComplementos(complementosSeleccionados) {
    let precios = JSON.parse(localStorage.getItem("element_item"));
    let precioComplementos = 0;
    // Recorremos los complementos seleccionados
    if (precios.Complemento) {
        complementosSeleccionados.forEach(complemento => {
            if (precios.Complemento[complemento]) {
                precioComplementos += precios.Complemento[complemento].costo;  // Sumamos el costo de cada complemento
            }
        });
    }
    return precioComplementos;
}