const catalogo = {
    "Crepas":[
        {
            "crepas sencillas":[
            {
                "Nutella":30.00,
                "Mermelada de fresa":30.00,
                "Mermelada de zarzamora":30.00,
                "Crema de coco":30.00,
                "Crema de cacahuate":30.00,
                "Queso philadelphia":40.00,
                "Cajeta":40.00
            }
            ],
            "crepas con fruta":[
                {
                    "Plátano":50.00,
                    "Manzana":50.00,
                    "Kiwi":60.00,
                    "Durazno":60.00,
                    "Uva":60.00,
                    "Fresa":60.00
                }
            ],
            "crepas especiales":[
                {
                    "Plátano con crema":80.00,
                    "Manzana con crema":80.00,
                    "Durazno con crema":80.00,
                    "Uva con crema":80.00,
                    "Fresa con crema":80.00
                }
            ],
            "crepas saladas":[
                {
                    "Jamón con 3 quesos":65.00,
                    "Champiñones con 3 quesos":65.00,
                    "Hawaiana":65.00
                }
            ],
            "complemento":[
                {
                    "Kinder delice":{
                        "costo":20.00,
                        "imagen":"images/kinder.jpg"
                    },
                    "Galleta oreo":{
                        "costo":15.00,
                        "imagen":"images/oreo_.jpg"
                    },
                    "Gansito":{
                        "costo":15.00,
                        "imagen":"images/gansito.jpeg"
                    },
                    "Muibon":{
                        "costo":10.00,
                        "imagen":"images/muibon.jpg"
                    },
                    "Mazapán":{
                        "costo":10.00,
                        "imagen":"images/mazapan.jpg"
                    },
                    "Nuez":{
                        "costo":10.00,
                        "imagen":"images/nuez.jpg"
                    },
                    "Arándanos":{
                        "costo":10.00,
                        "imagen":"images/arandanos.jpg"
                    }
                }
            ]
        }
    ]
 };
 localStorage.setItem('catalogo', JSON.stringify(catalogo));