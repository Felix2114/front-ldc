let pedidosListos = [];
let bebidasGlobal = [];

// Firebase App (obligatorio siempre)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

// Firestore
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc, 
  doc 
} from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC_gRa6lymckHIrZQwUyQEfnuvT-oAOdwk",
    authDomain: "l-d-c-2025.firebaseapp.com",
    databaseURL: "https://l-d-c-2025-default-rtdb.firebaseio.com",
    projectId: "l-d-c-2025",
    storageBucket: "l-d-c-2025.firebasestorage.app",
    messagingSenderId: "157848255104",
    appId: "1:157848255104:web:d46a4b8d8ecf6e3b020465"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);



document.addEventListener("DOMContentLoaded", async () => {
    const apiURL = "https://api-ldc.onrender.com/menu";
    const apiInventario = "https://api-ldc.onrender.com/inventario";
    const apiPedidos = "https://api-ldc.onrender.com/pedidos";
    const apiMesas = "https://api-ldc.onrender.com/mesas";

    const listaComidas = document.getElementById("tablaComidas");
    const listaSnacks = document.getElementById("tablaSnacks");
    const listaAntojitos = document.getElementById("tablaAntojitos");
    const listaMariscos = document.getElementById("tablaMariscos");
    const listaBebidas = document.getElementById("tablaBebidas");
    const listaMesas = document.getElementById("listaMesas");
    document.getElementById("fechaVentas").valueAsDate = new Date();


    // Escuchar cambios en la fecha
    document.getElementById("fechaVentas").addEventListener("change", () => {
        mostrarVentas(pedidosListos);
    });

  const fechaInput = document.getElementById("fechaConfirmar");

// ✅ Obtener la fecha actual en LOCAL y formatearla a YYYY-MM-DD
const hoy = new Date();
const year = hoy.getFullYear();
const month = String(hoy.getMonth() + 1).padStart(2, '0');
const day = String(hoy.getDate()).padStart(2, '0');
fechaInput.value = `${year}-${month}-${day}`; // 📌 Siempre muestra la fecha local

    document.getElementById("btnCargarPedidos").addEventListener("click", () => {
    cargarPedidosListosYMostrarConfirmar();
});

    // ⏳ Cargar el resto de datos en segundo plano
    cargarDatos();
   // setInterval(cargarDatos, 400000);// cambiar solo para que se actualice cuando se ocupe 

async function cargarPedidosListosYMostrarConfirmar() {
    const lista = document.getElementById("listaPedidosPorConfirmar");
    const fechaSeleccionada = document.getElementById("fechaConfirmar").value;

    if (!fechaSeleccionada) {
        lista.innerHTML = "<p>Selecciona una fecha.</p>";
        return;
    }

    lista.innerHTML = "<p>Cargando pedidos...</p>";

    try {
        const res = await fetch(`${apiPedidos}/estado/listo/fecha/${fechaSeleccionada}`);
        if (!res.ok) throw new Error("Error al obtener pedidos");

        const pedidos = await res.json();
        pedidosListos = pedidos;

        if (!pedidos.length) {
            lista.innerHTML = "<p>No hay pedidos para esta fecha.</p>";
            return;
        }

        const fragment = document.createDocumentFragment();

        pedidos.forEach(pedido => {
            const productosAgrupados = pedido.productos.reduce((acc, prod) => {
                if (!acc[prod.nombre]) acc[prod.nombre] = { cantidad: 0, precio: prod.precio };
                acc[prod.nombre].cantidad += prod.cantidad;
                return acc;
            }, {});

            let total = pedido.total || 0;
            let totalOriginal = 0;

            const listaProductosHTML = Object.entries(productosAgrupados)
                .map(([nombre, { cantidad, precio }]) => {
                    const subtotal = cantidad * precio;
                    totalOriginal += subtotal;
                    return `<li>${nombre} x${cantidad} - $${precio.toFixed(2)} c/u = $${subtotal.toFixed(2)}</li>`;
                })
                .join("");

            if (!total) total = totalOriginal;

            const card = document.createElement("div");
            card.className = "pedido-card p-2 mb-2 border rounded";
            card.dataset.id = pedido.id;

            card.innerHTML = `
                <h5>Mesa: ${pedido.mesaId || "Desconocida"}</h5>
                <p><strong>Mesera:</strong> ${pedido.mesera}</p>
                <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                <ul>${listaProductosHTML}</ul>
                <p><strong>Total:</strong> $${totalOriginal.toFixed(2)}</p>
                ${
                    pedido.descuento
                        ? `<p><strong>Descuento:</strong> ${pedido.descuento} -$${pedido.montoDescuento.toFixed(2)}</p>
                           <p><strong>Total con Descuento:</strong> $${total.toFixed(2)}</p>`
                        : ""
                }
                <label><strong>Método de Pago:</strong></label>
                <select class="form-select form-select-sm mb-2 metodo-pago">
                    <option value="" disabled selected>Selecciona método de pago</option>
                    <option value="Efectivo">Efectivo</option>
                    <option value="Tarjeta">Tarjeta</option>
                    <option value="Pendiente">Pendiente</option>
                </select>

                <label><strong>Descuento manual ($):</strong></label>
<input type="number" class="form-control form-control-sm mb-2 descuento-manual" placeholder="Ej: 50">

                <label><strong>Aplicar Descuento:</strong></label>
                <select class="form-select form-select-sm mb-2 descuento">
                    <option value="" disabled selected>Selecciona algun descuento</option>
                    <option value="Descuento Compas">Descuento Compas</option>
                    <option value="Descuento Especial">Descuento Especial</option>
                    <option value="Descuento Medio">Descuento Medio</option>
                    <option value="Descuento Antojitos">Descuento Antojitos</option>
                    <option value="Descuento Boing">Descuento Boing</option>
                    <option value="Descuento Coca-Cola">Descuento Coca-Cola</option>
                </select>
                <div class="d-flex gap-2">
                    <button class="btn btn-primary btn-sm imprimir-ticket">🧾 Imprimir ticket</button>
                    <button class="btn btn-success btn-sm marcar-guardado">Guardar</button>
                    <button class="btn btn-warning btn-sm marcar-descuento">Aplicar Descuento</button>
                    <button class="btn btn-danger btn-sm ms-auto eliminar">🗑️ Eliminar</button>
                </div>
                <hr>
            `;
            fragment.appendChild(card);
        });

        lista.innerHTML = "";
        lista.appendChild(fragment);



        

        // Delegación de eventos para todos los botones dentro del contenedor
       // Dentro de lista.onclick
lista.onclick = async (e) => {
    const card = e.target.closest(".pedido-card");
    if (!card) return;
    const id = card.dataset.id;
    const pedido = pedidos.find(p => p.id === id);

    // Imprimir ticket
    if (e.target.classList.contains("imprimir-ticket")) {
        imprimirTicket(pedido);
    }

    // Guardar método de pago y descuento
    if (e.target.classList.contains("marcar-guardado")) {
        const selectMetodo = card.querySelector(".metodo-pago");
        const selectDescuento = card.querySelector(".descuento");

        const metodoPago = selectMetodo.value.trim();
        const descuento = selectDescuento.value.trim();

        if (!metodoPago) {
            alert("Por favor, selecciona el método de pago antes de guardar.");
            selectMetodo.focus();
            return;
        }

        try {
            const response = await fetch(`${apiPedidos}/${id}/guardar`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    guardado: true,
                    metodo_Pago: metodoPago,
                    descuento: descuento || null
                    
                })
            });

            if (!response.ok) throw new Error("Error al marcar como guardado");

             alert("✅ Guardado exitosamente");
             
            card.remove();
        } catch (err) {
            console.error(err);
            alert("❌ No se pudo marcar el pedido como guardado.");
        }
    }

    // 📌 Aplicar descuento
    if (e.target.classList.contains("marcar-descuento")) {
        const selectDescuento = card.querySelector(".descuento");
        const inputDescuentoManual = card.querySelector(".descuento-manual");

        let descuento = inputDescuentoManual.value.trim() || selectDescuento.value.trim();

        if (!descuento) {
            alert("Por favor, selecciona un descuento antes de aplicar.");
            return;
        }

        try {
            const res = await fetch(`${apiPedidos}/${id}/descuento`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ descuento })
            });

            if (!res.ok) throw new Error("Error al aplicar descuento");

            const data = await res.json();

            // ✅ Actualizar el total visualmente en la tarjeta
            const totalElement = card.querySelector("p strong")?.parentElement;
            if (totalElement) {
                totalElement.innerHTML = `<strong>Total:</strong> $${data.totalFinal.toFixed(2)}`;
            }

            alert(`✅ Descuento aplicado. Total final: $${data.totalFinal.toFixed(2)}`);
        } catch (err) {
            console.error(err);
            alert("❌ No se pudo aplicar el descuento.");
        }
    }

    // Eliminar pedido
    if (e.target.classList.contains("eliminar")) {
        const confirmar = confirm("¿Estás seguro de que quieres eliminar este pedido?");
        if (!confirmar) return;

        try {
            await fetch(`${apiPedidos}/eliminar/${id}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
            alert("Pedido eliminado exitosamente");
            card.remove();
        } catch (error) {
            console.error("Error al eliminar pedido:", error);
            alert("Ocurrió un error al eliminar el pedido.");
        }
    }
};

    } catch (err) {
        console.error(err);
        lista.innerHTML = "<p>❌ Error al cargar los pedidos.</p>";
    }
}



    async function cargarDatos() {
        try {
            let [menuRes, inventarioRes, pedidosPendientesRes, mesasRes] = await Promise.all([
                fetch(apiURL),
                fetch(`${apiInventario}/bebidas`),
                fetch(`${apiPedidos}/estado/pendiente`),
                fetch(apiMesas)
            ]);

            let [menu, inventario, pedidosPendientes, mesas] = await Promise.all([
                menuRes.json(),
                inventarioRes.json(),
                pedidosPendientesRes.json(),
                mesasRes.json()
            ]);


            bebidasGlobal = inventario;

            mostrarMenu(menu);
            mostrarInventario(inventario);
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
        listaMariscos.innerHTML = "";

        const comidas = menu.filter(item => item.tipo === 'comida');
        const snacks = menu.filter(item => item.tipo === 'snack');
        const antojitos = menu.filter(item => item.tipo == 'antojito')
        const mariscos = menu.filter(item => item.tipo == 'marisco')

        comidas.forEach(comida => agregarFilaComida(comida, listaComidas));
        snacks.forEach(snack => agregarFilaComida(snack, listaSnacks));
        antojitos.forEach(antojitos => agregarFilaComida(antojitos, listaAntojitos));
        mariscos.forEach(mariscos => agregarFilaComida(mariscos, listaMariscos));
    }

    

   function mostrarInventario(inventario) {
    listaBebidas.innerHTML = "";

    if (Array.isArray(inventario)) {
        inventario.forEach(bebida => agregarFilaBebida(bebida));
        
        // Eliminar botón si ya existe para evitar duplicados
        const botonExistente = listaBebidas.parentElement.querySelector("#btnImprimirInventario");
        if (botonExistente) botonExistente.remove();

        // Crear botón con estilos
        const boton = document.createElement("button");
        boton.id = "btnImprimirInventario";
        boton.textContent = "Imprimir Inventario";
        
        // Bootstrap styles (puedes ajustar si usas otro framework)
        boton.className = "btn btn-success btn-sm mt-3";
        boton.style.display = "block"; // Que tome línea propia
        boton.style.marginLeft = "auto"; // Para alinear a la derecha
        boton.style.marginRight = "0";

        boton.onclick = () => imprimirTicketInventario(inventario);

        listaBebidas.parentElement.appendChild(boton);

    } else {
        console.error("Inventario inválido");
    }
}

function imprimirTicket(pedido) {
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString();

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

    let filasProductos = "";
    let totalOriginal = 0;

    for (const nombre in productosAgrupados) {
        const { precio, cantidad } = productosAgrupados[nombre];
        const subtotal = precio * cantidad;
        totalOriginal += subtotal;

        filasProductos += `
            <tr>
                <td>${nombre}</td>
                <td>${cantidad}</td>
                <td>$${precio.toFixed(2)}</td>
                <td>$${subtotal.toFixed(2)}</td>
            </tr>
        `;
    }

    // Total con descuento si existe
    const descuentoNombre = pedido.descuento || null;
    const montoDescuento = pedido.montoDescuento || 0; // monto que se resta
    const totalConDescuento = pedido.total || totalOriginal;

    const ventana = window.open('', '', 'width=400,height=700');

    ventana.document.write(`
        <html>
            <head>
                <title>Ticket</title>
                <style>
                    body { font-family: monospace; padding: 10px; margin: 0; text-align: center; }
                    img.logo { width: 100px; margin-bottom: 10px; }
                    h2 { margin: 0; }
                    .info { text-align: left; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border-bottom: 1px dashed #000; padding: 4px; text-align: center; }
                    .total { font-weight: bold; margin-top: 10px; text-align: right; }
                    .descuento { text-align: right; font-weight: bold; color: #0a0a0aff; }
                    .no-facturable { margin-top: 20px; padding: 8px; border: 2px dashed red; color: red; font-weight: bold; font-size: 14px; }
                    .saludo, .oferta { margin-top: 15px; font-size: 12px; }
                    .social { margin-top: 10px; font-size: 12px; }
                    .atencion { color: black;font-weight: bold;}

                </style>
            </head>
            <body>
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                
                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: bold;">LOS DOS CARNALES</h1>
                    <p style="margin: 0; font-size: 12px; font-style: italic; color: #0a0a0aff;">Restaurante Familiar</p>
                </div>

                <div class="info">
                    <p><strong>Folio:</strong> ${pedido.folio || ""}</p>
                    <p><strong>Atendió:</strong> ${pedido.mesera}</p>
                    <p><strong>Mesa:</strong> ${pedido.mesaId || "N/A"}</p>
                    <p><strong>Cliente:</strong> ${pedido.cliente || ""}</p>
                    <p><strong>Fecha y hora:</strong> ${pedido.fechaCompleta}</p>
                    <p><strong>Envio:</strong> ___________</p>
                </div>

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

                <div class="total">TOTAL: $${totalOriginal.toFixed(2)}</div>

                ${
                    descuentoNombre
                        ? `<div class="descuento">Descuento: ${descuentoNombre} -$${montoDescuento.toFixed(2)}</div>
                           <div class="total">TOTAL CON DESCUENTO: $${totalConDescuento.toFixed(2)}</div>`
                        : ""
                }

                <div class="no-facturable">ESTE TICKET NO ES FACTURABLE</div>
                <br>
                <div class="atencion">¿Cómo fue tu atención? (Buena / Mala)<br></div>
                <div class="saludo">¡Muchas gracias por su visita!</div>
                <div class="oferta">Camino al barreal s/n, Colonia Santa Teresa<br></div>
                <div class="social">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg" width="16" height="16" style="vertical-align:middle; margin-right:5px;">
                    Facebook Los Dos Carnales<br>
                </div>
                <div class="saludo">#somosLosDosCarnales👬</div>

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

function imprimirTicketInventario(bebidasGlobal) {
    const fecha = new Date();
    const fechaStr = fecha.toLocaleDateString();
    const horaStr = fecha.toLocaleTimeString();

    // Lista de nombres permitidos
    const permitidos = [
        "TEHUACAN TOPO CHICO",
        "SIDRAL",
        "REFRESCO PASCUAL",
        "COCA-COLA",
        "MODELO ESPECIAL",
        "CORONA CERO",
        "MEXICOLA",
        "TEHUACAN CHICO",
        "NEGRA MODELO",
        "BOING",
        "CERVEZA CUARTITO",
        "CORONA",
        "AGUA 600ML",
        "ULTRA",
        "AGUA 1LT",
        "VICTORIA",
        "BOTELLA TORITO",
        "PACIFICO"
    ];

    // Filtrar solo los productos permitidos
    const filtrados = bebidasGlobal.filter(b => permitidos.includes(b.nombre));

    let filas = "";
    filtrados.forEach(b => {
        filas += `
            <tr>
                <td>${b.nombre}</td>
                <td>${b.stock}</td>
                <td>$${parseFloat(b.precio).toFixed(2)}</td>
            </tr>
        `;
    });

    const ventana = window.open('', '', 'width=400,height=700');

    ventana.document.write(`
        <html>
            <head>
                <title>Inventario</title>
                <style>
                    body {
                        font-family: monospace;
                        padding: 10px;
                        text-align: center;
                        margin: 0;
                    }
                    img.logo {
                        width: 100px;
                        margin: 0 auto 10px auto;
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
                        margin-top: 10px;
                    }
                    th, td {
                        border-bottom: 1px dashed #000;
                        padding: 4px;
                        text-align: center;
                    }
                    .saludo {
                        margin-top: 15px;
                        font-size: 12px;
                    }
                </style>
            </head>
            <body>
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                <h2>INVENTARIO DE BEBIDAS</h2>
                
                <div class="info">
                    <p><strong>Fecha:</strong> ${fechaStr}</p>
                    <p><strong>Hora:</strong> ${horaStr}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Stock</th>
                            <th>Precio</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>

                <div class="saludo">¡Revisa el inventario con tiempo!</div>

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

    const pedidosFiltrados = pedidos.filter(pedido => {
        if (pedido.estado !== "listo") return false;

        // ✅ Comparamos directo las cadenas YYYY-MM-DD
        return pedido.fecha === fechaSeleccionada;
    });

    if (pedidosFiltrados.length === 0) {
        alert("No hay ventas para la fecha seleccionada.");
        return;
    }

    let total = 0;
    let efectivo = 0;
    let tarjeta = 0;
    let pendientes = 0;

    let countEfectivo = 0;
    let countTarjeta = 0;
    let countPendientes = 0;

    pedidosFiltrados.forEach(pedido => {
        total += pedido.total;
        if (pedido.metodo_Pago === "Efectivo") {
            efectivo += pedido.total;
            countEfectivo++;
        } else if (pedido.metodo_Pago === "Tarjeta") {
            tarjeta += pedido.total;
            countTarjeta++;
        } else {
            pendientes += pedido.total;
            countPendientes++;
        }
    });

    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write(`
        <html>
            <head>
                <title>Resumen de Ventas</title>
                <style>
                    body { font-family: monospace; padding: 10px; margin: 0; text-align: center; }
                    img.logo { width: 100px; margin-bottom: 10px; }
                    h2 { margin: 0; }
                    .info { text-align: left; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border-bottom: 1px dashed #000; padding: 4px; text-align: center; }
                    .total { font-weight: bold; margin-top: 10px; text-align: right; }
                    .no-facturable { margin-top: 20px; padding: 8px; border: 2px dashed red; color: red; font-weight: bold; font-size: 14px; }
                    .saludo { margin-top: 15px; font-size: 12px; }
                </style>
            </head>
            <body>
            
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: bold;">LOS DOS CARNALES</h1>
                    <p style="margin: 0; font-size: 12px; font-style: italic; color: #555;">Restaurante Familiar</p>
                </div>
                <h4>Resumen de Ventas</h4>
                <p><strong>Fecha:</strong> ${fechaSeleccionada}</p>
                <hr>
                <p><strong>Total de pedidos:</strong> ${pedidosFiltrados.length}</p>
                <p><strong>Total del día:</strong> $${total.toFixed(2)}</p>
                <p><strong>Total en Efectivo:</strong> $${efectivo.toFixed(2)} (${countEfectivo} pedidos)</p>
                <p><strong>Total con Tarjeta:</strong> $${tarjeta.toFixed(2)} (${countTarjeta} pedidos)</p>
                <p><strong>Total Pendientes:</strong> $${pendientes.toFixed(2)} (${countPendientes} pedidos)</p>
                <hr>
                <p style="text-align:center;">¡Gracias por su esfuerzo!</p>
                <div class="saludo">#somosLosDosCarnales👬</div>

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


function imprimirResumenMeseras(pedidos) {
    const fechaSeleccionada = document.getElementById("fechaVentas").value;

    if (!fechaSeleccionada) {
        alert("Selecciona una fecha para imprimir el resumen por meseras.");
        return;
    }

    // Filtramos pedidos listos y por la fecha
    const pedidosFiltrados = pedidos.filter(pedido => {
        if (pedido.estado !== "listo") return false;
        return pedido.fecha === fechaSeleccionada;
    });

    if (pedidosFiltrados.length === 0) {
        alert("No hay ventas para la fecha seleccionada.");
        return;
    }

    // 🔹 Agrupar por mesera
    const resumenMeseras = {};
    pedidosFiltrados.forEach(pedido => {
        const mesera = pedido.mesera || "Sin asignar";
        if (!resumenMeseras[mesera]) {
            resumenMeseras[mesera] = { pedidos: 0, total: 0 };
        }
        resumenMeseras[mesera].pedidos++;
        resumenMeseras[mesera].total += pedido.total;
    });

    // 🔹 Generar tabla
    let tablaHTML = `
        <table>
            <thead>
                <tr>
                    <th>Mesera</th>
                    <th>Pedidos</th>
                   
                </tr>
            </thead>
            <tbody>
    `;
    Object.keys(resumenMeseras).forEach(mesera => {
        tablaHTML += `
            <tr>
                <td>${mesera}</td>
                <td>${resumenMeseras[mesera].pedidos}</td>
                
            </tr>
        `;
    });
    tablaHTML += "</tbody></table>";

    // 🔹 Imprimir
    const ventana = window.open('', '', 'width=400,height=600');
    ventana.document.write(`
        <html>
            <head>
                <title>Resumen por Meseras</title>
                <style>
                    body { font-family: monospace; padding: 10px; margin: 0; text-align: center; }
                    img.logo { width: 100px; margin-bottom: 10px; }
                    h2 { margin: 0; }
                    .info { text-align: left; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
                    th, td { border-bottom: 1px dashed #000; padding: 4px; text-align: center; }
                    .total { font-weight: bold; margin-top: 10px; text-align: right; }
                    .saludo { margin-top: 15px; font-size: 12px; }
                </style>
            </head>
            <body>
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                <div style="margin-top: 10px; margin-bottom: 10px;">
                    <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: bold;">LOS DOS CARNALES</h1>
                    <p style="margin: 0; font-size: 12px; font-style: italic; color: #555;">Restaurante Familiar</p>
                </div>
                <h4>Resumen por Meseras</h4>
                <p><strong>Fecha:</strong> ${fechaSeleccionada}</p>
                <hr>
                ${tablaHTML}
                <hr>
                <p style="text-align:center;">¡Gracias por su esfuerzo!</p>
                <div class="saludo">#somosLosDosCarnales👬</div>

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


async function mostrarVentas() {
    const fechaSeleccionada = document.getElementById("fechaVentas").value;
    const listaVentas = document.getElementById("listaVentas");
    const totalVentas = document.getElementById("totalVentas");

    listaVentas.innerHTML = "";
    totalVentas.textContent = "0.00";

    if (!fechaSeleccionada) return;

    try {
        // Llamar a tu nuevo endpoint
        const res = await fetch(`${apiPedidos}/guardados/${fechaSeleccionada}`);
        if (!res.ok) throw new Error("Error al obtener pedidos guardados");
        const pedidosFiltrados = await res.json();

        // Ordenar por folio
        pedidosFiltrados.sort((a, b) => a.folio - b.folio);

        let total = 0;
        let totalEfectivo = 0;
        let totalTarjeta = 0;
        let totalPendientes = 0;

        pedidosFiltrados.forEach((pedido, index) => {
            const numeroPedido = index + 1;
            const fechaFormateada = pedido.fecha; 

            total += pedido.total;

            if (pedido.metodo_Pago === "Efectivo") totalEfectivo += pedido.total;
            else if (pedido.metodo_Pago === "Tarjeta") totalTarjeta += pedido.total;
            else totalPendientes += pedido.total;

            const li = document.createElement("li");
            li.classList.add("list-group-item");

            // Crear select para método de pago
            const selectMetodo = document.createElement("select");
            selectMetodo.className = "form-select form-select-sm mt-1";
            selectMetodo.innerHTML = `
                <option value="Efectivo" ${pedido.metodo_Pago === "Efectivo" ? "selected" : ""}>Efectivo</option>
                <option value="Tarjeta" ${pedido.metodo_Pago === "Tarjeta" ? "selected" : ""}>Tarjeta</option>
                <option value="Pendiente" ${!pedido.metodo_Pago || pedido.metodo_Pago === "Pendiente" ? "selected" : ""}>Pendiente</option>
            `;

            selectMetodo.addEventListener("change", async () => {
                const nuevoMetodo = selectMetodo.value;
                try {
                    const pedidoRef = doc(db, "pedidos", pedido.id);
                    await updateDoc(pedidoRef, { metodo_Pago: nuevoMetodo });
                    pedido.metodo_Pago = nuevoMetodo;
                    alert("Método de pago actualizado ✅");
                    mostrarVentas(); // Recarga la lista actualizada
                } catch (error) {
                    console.error("Error al actualizar el método de pago:", error);
                    alert("❌ No se pudo actualizar el método de pago.");
                }
            });

            li.innerHTML = `
                <strong style="font-size: 20px;">Pedido #${numeroPedido}</strong><br>
                <strong>Folio:</strong> ${pedido.folio}<br>
                <strong>Mesera:</strong> ${pedido.mesera}<br>
                <strong>Cliente:</strong> ${pedido.cliente}<br>
                <strong>Total:</strong> $${pedido.total.toFixed(2)}<br>
                <strong>Fecha:</strong> ${fechaFormateada}<br>
                <strong>Método de Pago:</strong>
            `;

            li.appendChild(selectMetodo);

            const btnImprimir = document.createElement("button");
            btnImprimir.textContent = "Imprimir ticket";
            btnImprimir.className = "btn btn-primary btn-sm ms-2";
            btnImprimir.addEventListener("click", () => imprimirTicket(pedido));

            li.appendChild(btnImprimir);
            listaVentas.appendChild(li);
        });

        totalVentas.textContent = total.toFixed(2);

        const resumenTotales = document.createElement("div");
        resumenTotales.className = "mt-3";
        resumenTotales.innerHTML = `
            <strong>Total Efectivo:</strong> $${totalEfectivo.toFixed(2)}<br>
            <strong>Total Tarjeta:</strong> $${totalTarjeta.toFixed(2)}<br>
            <strong>Total Pendientes:</strong> $${totalPendientes.toFixed(2)}
        `;

        listaVentas.appendChild(resumenTotales);

        const btnImprimirResumen = document.createElement("button");
        btnImprimirResumen.textContent = "🖨️ Imprimir resumen";
        btnImprimirResumen.className = "btn btn-success mt-3";
        btnImprimirResumen.addEventListener("click", () => imprimirResumenVentas(pedidosFiltrados));

        listaVentas.appendChild(btnImprimirResumen);

        const btnImprimirPorTipo = document.createElement("button");
btnImprimirPorTipo.textContent = "🖨️ Imprimir ventas por tipo";
btnImprimirPorTipo.className = "btn btn-warning mt-2";
btnImprimirPorTipo.addEventListener("click", () => imprimirVentasPorTipo(pedidosFiltrados));


const btnImprimirMeseras = document.createElement("button");
btnImprimirMeseras.textContent = "🖨️ Imprimir resumen por meseras";
btnImprimirMeseras.className = "btn btn-info mt-2";
btnImprimirMeseras.addEventListener("click", () => imprimirResumenMeseras(pedidosFiltrados));
listaVentas.appendChild(btnImprimirMeseras);


listaVentas.appendChild(btnImprimirPorTipo);

    } catch (error) {
        console.error("Error al mostrar ventas:", error);
        alert("❌ No se pudieron cargar las ventas.");
    }
}
async function imprimirVentasPorTipo(pedidos) {
    try {
        const fechaSeleccionada = document.getElementById("fechaVentas").value;

        if (!fechaSeleccionada) {
            alert("Selecciona una fecha para imprimir el resumen.");
            return;
        }

        // 🔹 Filtrar pedidos por fecha y estado
        const pedidosFiltrados = pedidos.filter(pedido => {
            if (pedido.estado !== "listo") return false;
            return pedido.fecha === fechaSeleccionada;
        });

        if (pedidosFiltrados.length === 0) {
            alert("No hay ventas para la fecha seleccionada.");
            return;
        }

        // 🔹 Traer menú para saber el tipo de cada producto
        const menuSnapshot = await getDocs(collection(db, "menu"));
        const menuMap = {};
        menuSnapshot.forEach(doc => {
            const data = doc.data();
            menuMap[data.nombre] = data.tipo; 
        });

        // 🔹 Agrupar ventas por tipo y acumular subtotal
        const ventasPorTipo = {};

        pedidosFiltrados.forEach(pedido => {
            if (!pedido.productos) return;
            pedido.productos.forEach(item => {
                const nombre = item.nombre;
                const cantidad = item.cantidad || 1;
                const precio = item.precio || 0;
                const subtotal = cantidad * precio;
                const tipo = menuMap[nombre] || "Desconocido";

                if (!ventasPorTipo[tipo]) ventasPorTipo[tipo] = { productos: {}, totalTipo: 0 };
                if (!ventasPorTipo[tipo].productos[nombre]) ventasPorTipo[tipo].productos[nombre] = { cantidad: 0, precio: precio, subtotal: 0 };

                ventasPorTipo[tipo].productos[nombre].cantidad += cantidad;
                ventasPorTipo[tipo].productos[nombre].subtotal += subtotal;
                ventasPorTipo[tipo].totalTipo += subtotal;
            });
        });

        // 🔹 Generar tabla HTML ordenada por tipo y nombre
        let tablaHTML = "";
        Object.keys(ventasPorTipo)
            .sort()
            .forEach(tipo => {
                tablaHTML += `<h4 style="margin-top:10px;">${tipo.toUpperCase()}</h4>`;
                tablaHTML += `<table><thead><tr><th>Producto</th><th>Precio</th><th>Cant.</th><th>Subtotal</th></tr></thead><tbody>`;
                
                Object.keys(ventasPorTipo[tipo].productos)
                    .sort()
                    .forEach(nombre => {
                        const prod = ventasPorTipo[tipo].productos[nombre];
                        tablaHTML += `<tr>
                            <td>${nombre}</td>
                            <td>$${prod.precio.toFixed(2)}</td>
                            <td>${prod.cantidad}</td>
                            <td>$${prod.subtotal.toFixed(2)}</td>
                        </tr>`;
                    });

                // Total por tipo
                tablaHTML += `<tr>
                    <td colspan="3" style="text-align:right; font-weight:bold;">TOTAL ${tipo}:</td>
                    <td style="font-weight:bold;">$${ventasPorTipo[tipo].totalTipo.toFixed(2)}</td>
                </tr>`;

                tablaHTML += `</tbody></table>`;
            });

        // 🔹 Imprimir ticket
        const ventana = window.open('', '', 'width=400,height=600');
        ventana.document.write(`
            <html>
                <head>
                    <title>Ventas por Tipo</title>
                    <style>
                        body { font-family: monospace; padding: 10px; margin: 0; text-align: center; }
                        img.logo { width: 100px; margin-bottom: 10px; }
                        h2 { margin: 0; }
                        table { width: 100%; border-collapse: collapse; margin: 5px 0; }
                        th, td { border-bottom: 1px dashed #000; padding: 4px; text-align: center; }
                        h4 { margin: 8px 0 4px 0; font-size: 14px; text-decoration: underline; }
                        .saludo { margin-top: 15px; font-size: 12px; }
                    </style>
                </head>
                <body>
                    <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo" alt="Logo"><br>
                    <div style="margin-top: 10px; margin-bottom: 10px;">
                        <h1 style="margin: 0; font-size: 20px; letter-spacing: 1px; font-weight: bold;">LOS DOS CARNALES</h1>
                        <p style="margin: 0; font-size: 12px; font-style: italic; color: #555;">Restaurante Familiar</p>
                    </div>
                    <h4>Ventas por Tipo</h4>
                    <p><strong>Fecha:</strong> ${fechaSeleccionada}</p>
                    <hr>
                    ${tablaHTML}
                    <hr>
                    <p style="text-align:center;">¡Gracias por su esfuerzo!</p>
                    <div class="saludo">#somosLosDosCarnales👬</div>

                    <script>
                        window.onload = function() {
                            window.print();
                            setTimeout(() => window.close(), 500);
                        }
                    </script>
                </body>
            </html>
        `);

    } catch (error) {
        console.error("Error al generar ventas por tipo:", error);
        alert("❌ No se pudo generar el resumen por tipo.");
    }
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


    document.getElementById("agregarMarisco").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Marisco:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "marisco" })
            });
            cargarDatos();
            alert("Marisco agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar Marisco:", error);
        }
    });


    let intervaloActualizacion;

    // Iniciar carga de datos al abrir la página
    cargarDatos();
     //setInterval(cargarDatos, 15000);


     document.addEventListener("focusin", (e) => {
    if (e.target.tagName === "SELECT" && e.target.id.startsWith("metodoPago-")) {
        clearInterval(intervaloActualizacion);
    }
});

document.addEventListener("focusout", (e) => {
    if (e.target.tagName === "SELECT" && e.target.id.startsWith("metodoPago-")) {
        intervaloActualizacion = setInterval(cargarDatos, 15000);
    }
    });
});
