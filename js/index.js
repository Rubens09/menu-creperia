$(document).ready(function() {
    const storedData = localStorage.getItem('catalogo');
    if (storedData) {
        const parsedData = JSON.parse(storedData);
        //console.log(parsedData);
        recorrerObjeto(parsedData);
    } else {
        //console.log("No se encontraron datos en localStorage.");
    }
});

// Función para recorrer el objeto y generar HTML dinámicamente
const recorrerObjeto = (obj) => {
    let menu_ = "";
    let complemento="";

    // Primero, recorremos el objeto principal
    Object.entries(obj).forEach(([key, value]) => {
        //console.log(`Clave: ${key}, Valor: ${value}`);
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
                        //console.log(`Sub Clave: ${subKey}, Sub Valor: ${subValue}`);
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
                                console.log(subvvalue);
                                complemento+=`
                                <div class="item">
                                    <div class="img-box">
                                        <h7 style="font-size: 20px;font-weight: bold;margin-bottom: 15px;font-family: 'bodoni svtytwo sc itc tt book', sans-serif;font-weight: 400;margin-left:70px;color: #8B4513;">`+item+`</h7>
                                        <img src="`+cost.imagen+`" alt="" width="100px;" height="200px;"/>
                                    </div>
                                    <p style="font-size: 15px;font-weight: bold;margin-bottom: 15px;font-weight: 400;margin-left:55px;color: #8B4513;">Costo extra: $`+cost.costo.toFixed(2)+`</p>
                                </div>
                                `;
                            });
                        });
                        if(complemento!=""){
                            $("#title-complemento").show();
                            $("#items-complemento").show();
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
    //console.log(menu_);
    $("#menu").append(menu_);
};