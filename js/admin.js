let pedidosListos = [];

document.addEventListener("DOMContentLoaded", async () => {
    const apiURL = "https://api-ldc.onrender.com/menu";
    const apiInventario = "https://api-ldc.onrender.com/inventario";
    const apiPedidos = "https://api-ldc.onrender.com/pedidos";
    const apiMesas = "https://api-ldc.onrender.com/mesas";

    const listaComidas = document.getElementById("tablaComidas");
    const listaSnacks = document.getElementById("tablaSnacks");
    const listaAntojitos = document.getElementById("tablaAntojitos");
    const listaBebidas = document.getElementById("tablaBebidas");
    const listaMesas = document.getElementById("listaMesas");
 document.getElementById("fechaVentas").valueAsDate = new Date();
await cargarDatos();

    // Escuchar cambios en la fecha
    document.getElementById("fechaVentas").addEventListener("change", () => {
        mostrarVentas(pedidosListos);
    });

    const fechaInput = document.getElementById("fechaConfirmar");
    
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");

    fechaInput.value = `${yyyy}-${mm}-${dd}`;
  


    async function cargarDatos() {
        try {
            let [menuRes, inventarioRes, pedidosPendientesRes, pedidosListosRes, mesasRes] = await Promise.all([
                fetch(apiURL),
                fetch(`${apiInventario}/bebidas`),
                fetch(`${apiPedidos}/estado/pendiente`),
                fetch(`${apiPedidos}/estado/listo`),
                fetch(apiMesas)
            ]);

            let [menu, inventario, pedidosPendientes,pedidosListosData, mesas] = await Promise.all([
                menuRes.json(),
                inventarioRes.json(),
                pedidosPendientesRes.json(),
                pedidosListosRes.json(),
                mesasRes.json()
            ]);

           //  pedidosGlobal = pedidosListos;
           pedidosListos = pedidosListosData;
            mostrarMenu(menu);
            mostrarInventario(inventario);
           // mostrarVentas(pedidosListos);
            mostrarPedidosPorConfirmar(pedidosListosData);
            mostrarMesas(mesas);

           mostrarVentas(pedidosListos);

        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    }


    function mostrarMesas(mesas) {
        listaMesas.innerHTML = "";
      
        // Ordenar las mesas por el número de mesa de menor a mayor
        mesas.sort((a, b) => a.numero - b.numero);
      
        mesas.forEach((mesa) => {
           // console.log("Mesas recibidas:", mesas);
            let row = document.createElement("tr");
            row.innerHTML = `
                <td>${mesa.numero}</td>
                <td>${mesa.disponible ? "✅ Disponible" : "❌ Ocupada"}</td>
                <td>
                    <button class="btn btn-danger btn-sm eliminar">🗑️ Eliminar</button>
                </td>
            `;
      
            // Eliminar mesa
            row.querySelector(".eliminar").addEventListener("click", async () => {
                await eliminarMesa(mesa.id);
                cargarDatos();
                alert("Mesa eliminada correctamente.");
            });
      
            listaMesas.appendChild(row);
        });
    }
    


    async function eliminarMesa(mesaId) {
        try {
            const response = await fetch(`${apiMesas}/${mesaId}`, {
                method: "DELETE",
            });
    
            if (response.ok) {
                alert("Mesa eliminada correctamente.");
            } else {
                alert("Error al eliminar la mesa.");
            }
        } catch (error) {
            console.error("Error al eliminar la mesa:", error);
            alert("Ocurrió un error al eliminar la mesa.");
        }
    }
    
    

    function obtenerUltimoNumeroMesa(mesas) {
        if (!mesas || mesas.length === 0) return 0;
        return Math.max(...mesas.map(m => m.numero));
    }
    
    

    document.getElementById("btnAgregarMesas").addEventListener("click", async () => {
        const input = document.getElementById("numMesas");
        const cantidad = parseInt(input.value);
    
        if (isNaN(cantidad) || cantidad <= 0) {
            alert("Por favor, ingresa un número válido de mesas a agregar.");
            return;
        }
    
        try {
            // Obtener mesas actuales para calcular el último número
            const response = await fetch(apiMesas);
            const mesasActuales = await response.json();
            let ultimoNumero = obtenerUltimoNumeroMesa(mesasActuales);
    
            // Agregar mesas numeradas automáticamente
            for (let i = 1; i <= cantidad; i++) {
                await fetch(apiMesas, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        numero: ultimoNumero + i,
                        disponible: true
                    })
                });
            }
    
            alert(`${cantidad} mesas agregadas correctamente.`);
            input.value = "";
            cargarDatos(); // recargar lista
        } catch (error) {
            console.error("Error al agregar mesas:", error);
            alert("Ocurrió un error al agregar las mesas.");
        }
    });
    

    

    function mostrarMenu(menu) {
        listaComidas.innerHTML = "";
        listaSnacks.innerHTML = "";
        listaAntojitos.innerHTML = "";

        const comidas = menu.filter(item => item.tipo === 'comida');
        const snacks = menu.filter(item => item.tipo === 'snack');
        const antojitos = menu.filter(item => item.tipo == 'antojito')

        comidas.forEach(comida => agregarFilaComida(comida, listaComidas));
        snacks.forEach(snack => agregarFilaComida(snack, listaSnacks));
        antojitos.forEach(antojitos => agregarFilaComida(antojitos, listaAntojitos));
    }

    function mostrarInventario(inventario) {
        listaBebidas.innerHTML = "";
        if (Array.isArray(inventario)) {
            inventario.forEach(bebida => agregarFilaBebida(bebida));
        } else {
            console.error("Inventario inválido");
        }
    }

function mostrarPedidosPorConfirmar(pedidos) {
    const lista = document.getElementById("listaPedidosPorConfirmar");
    const fechaSeleccionada = document.getElementById("fechaConfirmar").value;
    lista.innerHTML = "";

    if (!fechaSeleccionada) return;

    const [year, month, day] = fechaSeleccionada.split("-");
    const fechaInput = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (pedido.estado !== "listo") return false;
        const fechaPedido = new Date(pedido.fecha._seconds * 1000);

        return (
            fechaPedido.getFullYear() === fechaInput.getFullYear() &&
            fechaPedido.getMonth() === fechaInput.getMonth() &&
            fechaPedido.getDate() === fechaInput.getDate()
        );
    });

    pedidosFiltrados.forEach(pedido => {
        const card = document.createElement("div");
        card.className = "pedido-card";

        // Agrupar productos por nombre
        const productosAgrupados = {};

        pedido.productos.forEach(prod => {
            if (productosAgrupados[prod.nombre]) {
                productosAgrupados[prod.nombre].cantidad += prod.cantidad;
            } else {
                productosAgrupados[prod.nombre] = {
                    cantidad: prod.cantidad,
                    precio: prod.precio
                };
            }
        });

        // Crear lista de productos con subtotal
        let listaProductosHTML = "";
        let total = 0;

        for (const nombre in productosAgrupados) {
            const { cantidad, precio } = productosAgrupados[nombre];
            const subtotal = cantidad * precio;
            total += subtotal;

            listaProductosHTML += `<li>${nombre} x${cantidad} - $${precio.toFixed(2)} c/u = $${subtotal.toFixed(2)}</li>`;
        }

        card.innerHTML = `
            <h5>Mesa: ${pedido.mesaId || "Desconocida"}</h5>
            <p><strong>Mesera:</strong> ${pedido.mesera}</p>
            <ul>
                ${listaProductosHTML}
            </ul>
            <p><strong>Total:</strong> $${total.toFixed(2)}</p>
            <button class="btn btn-primary btn-sm imprimir-ticket">🧾 Imprimir ticket</button>
            <button class="btn btn-secondary btn-sm ocultar-pedido ms-2">Ocultar</button>
            <hr>
        `;

        card.querySelector(".imprimir-ticket").addEventListener("click", () => {
            imprimirTicket(pedido);
        });

        card.querySelector(".ocultar-pedido").addEventListener("click", () => {
            card.remove();
        });

        lista.appendChild(card);
    });
}




function imprimirTicket(pedido) {
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString();

    // Agrupar productos por nombre
    const productosAgrupados = {};

    pedido.productos.forEach(p => {
        if (productosAgrupados[p.nombre]) {
            productosAgrupados[p.nombre].cantidad += p.cantidad || 1;
        } else {
            productosAgrupados[p.nombre] = {
                precio: p.precio,
                cantidad: p.cantidad || 1
            };
        }
    });

    // Construir filas HTML de la tabla
    let filasProductos = "";
    let total = 0;

    for (const nombre in productosAgrupados) {
        const { precio, cantidad } = productosAgrupados[nombre];
        const subtotal = precio * cantidad;
        total += subtotal;

        filasProductos += `
            <tr>
                <td>${nombre}</td>
                <td>${cantidad}</td>
                <td>$${precio.toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    }

    const ventana = window.open('', '', 'width=400,height=700');

    ventana.document.write(`
        <html>
            <head>
                <title>Ticket</title>
                <style>
                    body {
                        font-family: monospace;
                        padding: 10px;
                        text-align: center;
                    }
                    img.logo {
                        width: 100px;
                        margin-bottom: 10px;
                    }
                    h2 {
                        margin: 0;
                    }
                    .info {
                        text-align: left;
                        margin: 10px 0;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin: 10px 0;
                    }
                    th, td {
                        border-bottom: 1px dashed #000;
                        padding: 4px;
                        text-align: center;
                    }
                    .total {
                        font-weight: bold;
                        margin-top: 10px;
                        text-align: right;
                    }
                    .saludo, .oferta {
                        margin-top: 15px;
                        font-size: 12px;
                    }
                    .social {
                        margin-top: 10px;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <!-- ✅ Logotipo -->
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                
                <!-- ✅ Nombre y ubicación -->
                <h2>Los Dos Carnales</h2>

                <!-- ✅ Información del pedido -->
                <div class="info">
                    <p>Atendió: ${pedido.mesera}</p>
                    <p>Mesa: ${pedido.mesaId || "N/A"}</p>
                    <p>Fecha: ${fechaStr}</p>
                    <p>Hora: ${horaStr}</p>
                </div>

                <!-- ✅ Detalle de productos -->
                <table>
                    <thead>
                        <tr>
                            <th>Artículo</th>
                            <th>Cant</th>
                            <th>Prec</th>
                            <th>Importe</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filasProductos}
                    </tbody>
                </table>

                <!-- ✅ Total -->
                <div class="total">TOTAL: $${total.toFixed(2)}</div>

                <!-- ✅ Saludo y oferta -->
                <div class="saludo">¡Muchas gracias por su visita!</div>
                <div class="oferta">
                    Camino al barreal s/n, Colonia Santa Teresa<br>
                </div>

                <!-- ✅ Redes sociales -->
                <div class="social">
    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" width="16" height="16" style="vertical-align:middle; margin-right:5px;">
    Facebook Los Dos Carnales<br>
</div>


                <div class="saludo">
                    #somosLosDosCarnales👬
                </div>

                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
        </html>
    `);
}





function imprimirResumenVentas(pedidos) {
    const fechaSeleccionada = document.getElementById("fechaVentas").value;

    if (!fechaSeleccionada) {
        alert("Selecciona una fecha para imprimir el resumen.");
        return;
    }

    const [year, month, day] = fechaSeleccionada.split("-");
    const fechaInput = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (pedido.estado !== "listo") return false;
        const fechaPedido = new Date(pedido.fecha._seconds * 1000);

        return (
            fechaPedido.getFullYear() === fechaInput.getFullYear() &&
            fechaPedido.getMonth() === fechaInput.getMonth() &&
            fechaPedido.getDate() === fechaInput.getDate()
        );
    });

    if (pedidosFiltrados.length === 0) {
        alert("No hay ventas para la fecha seleccionada.");
        return;
    }

    let total = 0;

    const detallesHTML = pedidosFiltrados.map(pedido => {
        const fechaPedido = new Date(pedido.fecha._seconds * 1000);
        const hora = fechaPedido.toLocaleTimeString();
        total += pedido.total;

        return `
            <li>
                Mesera: ${pedido.mesera} |
                Total: $${pedido.total.toFixed(2)} |
                Hora: ${hora}
            </li>
        `;
    }).join("");

    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write(`
        <html>
            <head>
                <title>Resumen de Ventas</title>
                <style>
                    body { font-family: monospace; padding: 10px; }
                    h3, h4 { text-align: center; }
                    ul { padding-left: 0; list-style: none; }
                    li { margin: 5px 0; }
                    .total { font-weight: bold; margin-top: 15px; text-align: center; }
                </style>
            </head>
            <body>
                <h3>Los Dos Carnales</h3>
                <h4>Resumen de Ventas</h4>
                <p><strong>Fecha:</strong> ${fechaSeleccionada}</p>
                <hr>
                <ul>
                    ${detallesHTML}
                </ul>
                <hr>
                <p class="total">TOTAL DEL DÍA: $${total.toFixed(2)}</p>
                <p style="text-align:center;">¡Gracias por su esfuerzo!</p>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
        </html>
    `);
}



    
    
    

 function mostrarVentas(pedidos) {
    const fechaSeleccionada = document.getElementById("fechaVentas").value;
    const listaVentas = document.getElementById("listaVentas");
    const totalVentas = document.getElementById("totalVentas");

    listaVentas.innerHTML = "";
    totalVentas.textContent = "0.00";

    if (!fechaSeleccionada) return;

    // 🔧 Construimos fecha local (no UTC)
    const [year, month, day] = fechaSeleccionada.split("-");
    const fechaInput = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (pedido.estado !== "listo") return false;

        const fechaPedido = new Date(pedido.fecha._seconds * 1000);

        return (
            fechaPedido.getFullYear() === fechaInput.getFullYear() &&
            fechaPedido.getMonth() === fechaInput.getMonth() &&
            fechaPedido.getDate() === fechaInput.getDate()
        );
    });

    let total = 0;

    pedidosFiltrados.forEach(pedido => {
        const fechaPedido = new Date(pedido.fecha._seconds * 1000);
        const fechaFormateada = fechaPedido.toLocaleString();

        total += pedido.total;

        const li = document.createElement("li");
        li.classList.add("list-group-item");
        li.innerHTML = `
            <strong>Mesera:</strong> ${pedido.mesera}<br>
            <strong>Total:</strong> $${pedido.total.toFixed(2)}<br>
            <strong>Fecha:</strong> ${fechaFormateada}
        `;

        listaVentas.appendChild(li);
    });

    totalVentas.textContent = total.toFixed(2);

    const btnImprimir = document.createElement("button");
    btnImprimir.textContent = "🖨️ Imprimir resumen";
    btnImprimir.className = "btn btn-success mt-3";
    btnImprimir.addEventListener("click", () => {
        imprimirResumenVentas(pedidos); // 🔥 Llama a tu función existente
    });

    listaVentas.appendChild(btnImprimir);

   
}


    function agregarFilaComida(producto, lista) {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td contenteditable="true">${producto.nombre}</td>
            <td contenteditable="true">${producto.precio}</td>
            <td>
                <button class="btn btn-danger btn-sm eliminar">🗑️ Eliminar</button>
                <button class="btn btn-success btn-sm editar">✅ Guardar</button>
            </td>
        `;

        row.querySelector(".eliminar").addEventListener("click", async () => {
            await eliminarProducto(producto.id);
            cargarDatos();
            alert("Comida eliminada correctamente.");
        });

        row.querySelector(".editar").addEventListener("click", async () => {
            let nuevoNombre = row.children[0].textContent.trim();
            let nuevoPrecio = parseFloat(row.children[1].textContent.trim());

            if (!nuevoNombre || isNaN(nuevoPrecio)) {
                alert("Nombre o precio inválido");
                return;
            }

            await actualizarProducto(producto.id, nuevoNombre, nuevoPrecio);
            cargarDatos();
            alert("Comida actualizada correctamente.");
        });

        lista.appendChild(row);
    }

    function agregarFilaBebida(bebida) {
        let row = document.createElement("tr");
        row.innerHTML = `
            <td contenteditable="true">${bebida.nombre}</td>
            <td contenteditable="true">${bebida.precio}</td>
            <td contenteditable="true">${bebida.stock}</td>
            <td>
                <button class="btn btn-danger btn-sm eliminar">🗑️ Eliminar</button>
                <button class="btn btn-success btn-sm editar">✅ Guardar</button>
            </td>
        `;

        row.querySelector(".eliminar").addEventListener("click", async () => {
            await eliminarBebida(bebida.id);
            cargarDatos();
            alert("Bebida eliminada correctamente.");
        });

        row.querySelector(".editar").addEventListener("click", async () => {
            let nuevoNombre = row.children[0].textContent.trim();
            let nuevoPrecio = parseFloat(row.children[1].textContent.trim());
            let nuevoStock = parseInt(row.children[2].textContent.trim());

            if (!nuevoNombre || isNaN(nuevoPrecio) || isNaN(nuevoStock)) {
                alert("Nombre, precio o stock inválido");
                return;
            }

            await actualizarBebida(bebida.id, nuevoNombre, nuevoPrecio, nuevoStock);
            cargarDatos();
            alert("Bebida actualizada correctamente.");
        });

        listaBebidas.appendChild(row);
    }

    async function eliminarProducto(id) {
        try {
            await fetch(`${apiURL}/${id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Error eliminando producto:", error);
        }
    }

    async function actualizarProducto(id, nombre, precio) {
        try {
            await fetch(`${apiURL}/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio })
            });
        } catch (error) {
            console.error("Error actualizando producto:", error);
        }
    }

    async function eliminarBebida(id) {
        try {
            await fetch(`${apiInventario}/bebidas/${id}`, { method: "DELETE" });
        } catch (error) {
            console.error("Error eliminando bebida:", error);
        }
    }

    async function actualizarBebida(id, nombre, precio, stock) {
        try {
            await fetch(`${apiInventario}/bebidas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, stock })
            });
        } catch (error) {
            console.error("Error actualizando bebida:", error);
        }
    }

    

    // Agregar Bebida
    document.getElementById("agregarBebida").addEventListener("click", async () => {
        const nombre = prompt("Nombre de la bebida:");
        const precio = parseFloat(prompt("Precio:"));
        const stock = parseInt(prompt("Stock inicial:"));

        if (!nombre || isNaN(precio) || isNaN(stock)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(`${apiInventario}/bebidas`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, stock })
            });
            cargarDatos();
            alert("Bebida agregada correctamente.");
        } catch (error) {
            console.error("Error agregando bebida:", error);
        }
    });

    // Agregar Comida
    document.getElementById("agregarComida").addEventListener("click", async () => {
        const nombre = prompt("Nombre de la comida:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "comida" })
            });
            cargarDatos();
            alert("Comida agregada correctamente.");
        } catch (error) {
            console.error("Error agregando comida:", error);
        }
    });

    // Agregar Snack
    document.getElementById("agregarSnack").addEventListener("click", async () => {
        const nombre = prompt("Nombre del snack:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "snack" })
            });
            cargarDatos();
            alert("Snack agregado correctamente.");
        } catch (error) {
            console.error("Error agregando snack:", error);
        }
    });


     document.getElementById("agregarAntojito").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Antojito:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "antojito" })
            });
            cargarDatos();
            alert("Antojito agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar Antojito:", error);
        }
    });


    // Iniciar carga de datos al abrir la página
    cargarDatos();
     setInterval(cargarDatos, 5000);
});
