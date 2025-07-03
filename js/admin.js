let pedidosListos = [];

document.addEventListener("DOMContentLoaded", async () => {
    const apiURL = "https://api-ldc.onrender.com/menu";
    const apiInventario = "https://api-ldc.onrender.com/inventario";
    const apiPedidos = "https://api-ldc.onrender.com/pedidos";
    const apiMesas = "https://api-ldc.onrender.com/mesas";

    const listaComidas = document.getElementById("tablaComidas");
    const listaSnacks = document.getElementById("tablaSnacks");
    const listaBebidas = document.getElementById("tablaBebidas");
    const listaMesas = document.getElementById("listaMesas");
 document.getElementById("fechaVentas").valueAsDate = new Date();
await cargarDatos();

    // Escuchar cambios en la fecha
    document.getElementById("fechaVentas").addEventListener("change", () => {
        mostrarVentas(pedidosListos);
    });

  


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

        const comidas = menu.filter(item => item.tipo === 'comida');
        const snacks = menu.filter(item => item.tipo === 'snack');

        comidas.forEach(comida => agregarFilaComida(comida, listaComidas));
        snacks.forEach(snack => agregarFilaComida(snack, listaSnacks));
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
    lista.innerHTML = "";

    // 👉 Filtrar solo los pedidos con estado "listo"
    const pedidosListosConfirmados = pedidos.filter(pedido => pedido.estado === "listo");

    pedidosListosConfirmados.forEach(pedido => {
        const card = document.createElement("div");
        card.className = "pedido-card";

        card.innerHTML = `
            <h5>Mesa: ${pedido.mesaId || "Desconocida"}</h5>
            <p><strong>Mesera:</strong> ${pedido.mesera}</p>
            <ul>
                ${pedido.productos.map(prod => `<li>${prod.nombre} - $${prod.precio.toFixed(2)}</li>`).join('')}
            </ul>
            <p><strong>Total:</strong> $${pedido.total.toFixed(2)}</p>
            <button class="btn btn-primary btn-sm imprimir-ticket">🧾 Imprimir ticket</button>
            <button class="btn btn-secondary btn-sm ocultar-pedido ms-2">Ocultar</button>
            <hr>
        `;

        // 👉 Evento para imprimir
        card.querySelector(".imprimir-ticket").addEventListener("click", () => {
            imprimirTicket(pedido);
        });

        // 👉 Evento para ocultar el pedido
        card.querySelector(".ocultar-pedido").addEventListener("click", () => {
            card.remove(); // Quita el pedido de la vista
        });

        lista.appendChild(card);
    });
}



function imprimirTicket(pedido) {
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write(`
        <html>
            <head>
                <title>Ticket</title>
                <style>
                    body { font-family: monospace; padding: 10px; }
                    h3 { text-align: center; }
                    ul { padding-left: 0; list-style: none; }
                    li { margin: 2px 0; }
                    .total { font-weight: bold; margin-top: 10px; }
                </style>
            </head>
            <body>
                <h3>Los Dos Carnales</h3>
                <p><strong>Mesa:</strong> ${pedido.mesaId}</p>
                <p><strong>Mesera:</strong> ${pedido.mesera}</p>
                <hr>
                <ul>
                    ${pedido.productos.map(p => `<li>${p.nombre} x${p.cantidad || 1} - $${p.precio.toFixed(2)}</li>`).join('')}
                </ul>
                <hr>
                <p class="total">Total: $${pedido.total.toFixed(2)}</p>
                <p style="text-align:center;">¡Gracias por su visita a Los Dos Carnales!</p>
                <p style="text-align:center;">Visita nuestra pagina de Facebook "Los Dos Carnales"</p>
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

    // Iniciar carga de datos al abrir la página
    cargarDatos();
     setInterval(cargarDatos, 5000);
});
