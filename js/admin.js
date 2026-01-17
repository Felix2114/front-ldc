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

import { 
  cargarTiposBebidas,
  setBebidasGlobal
} from "../js/inventario.js";

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
   // const apiInventario = "http://localhost:5000/tipoBebidas";
   //const apiBebidas = "http://localhost:5000/inventario";
    const apiInventario = "https://api-ldc.onrender.com/tipoBebidas"; 
    const apiBebidas = "https://api-ldc.onrender.com/inventario";

    const apiPedidos = "https://api-ldc.onrender.com/pedidos";
    const apiMesas = "https://api-ldc.onrender.com/mesas";

    const listaComidas = document.getElementById("tablaComidas");
    const listaSnacks = document.getElementById("tablaSnacks");
    const listaAntojitos = document.getElementById("tablaAntojitos");
    const listaMariscos = document.getElementById("tablaMariscos");
    const listaBebidas = document.getElementById("tablaBebidas");
    const listaCigarros = document.getElementById("tablaCigarros");
    const listaChidas = document.getElementById("tablaChidas");
    const listaDulces = document.getElementById("tablaDulces");
    const listaPostres = document.getElementById("tablaPostres");
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
        const [
            menuRes,
            tiposBebidasRes,
            bebidasRes,
            pedidosPendientesRes,
            mesasRes
        ] = await Promise.all([
            fetch(apiURL),
            fetch(`${apiInventario}/bebidas/tipos-bebidas`),
            fetch(`${apiBebidas}/bebidas`),
            fetch(`${apiPedidos}/estado/pendiente`),
            fetch(apiMesas)
        ]);

        const [
            menu,
            tiposBebidas,
            bebidas,
            pedidosPendientes,
            mesas
        ] = await Promise.all([
            menuRes.json(),
            tiposBebidasRes.json(),
            bebidasRes.json(),
            pedidosPendientesRes.json(),
            mesasRes.json()
        ]);

        mostrarMenu(menu);
        mostrarMesas(mesas);
        mostrarVentas(pedidosPendientes);

        // 🔥 INVENTARIO
        setBebidasGlobal(bebidas); // por ahora vacío
        await cargarTiposBebidas(tiposBebidas);
        if (tiposBebidas.length > 0) {
    const primerTipo = tiposBebidas[0].nombre;
    
    // Llamada segura a la función global
    if (typeof window.filtrarBebidasPorTipo === 'function') {
        window.filtrarBebidasPorTipo(primerTipo);
    }
}
        

    } catch (error) {
        console.error("❌ Error al cargar datos:", error);
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
        listaCigarros.innerHTML = "";
        listaChidas.innerHTML = "";
        listaDulces.innerHTML = "";
        listaPostres.innerHTML = "";

        const comidas = menu.filter(item => item.tipo === 'comida');
        const snacks = menu.filter(item => item.tipo === 'snack');
        const antojitos = menu.filter(item => item.tipo == 'antojito')
        const mariscos = menu.filter(item => item.tipo == 'marisco')
        const cigarros = menu.filter(item => item.tipo == 'cigarro')
        const chidas = menu.filter(item => item.tipo == 'chida')
        const dulces = menu.filter(item => item.tipo == 'dulce')
        const postres = menu.filter(item => item.tipo == 'postre')

        comidas.forEach(comida => agregarFilaComida(comida, listaComidas));
        snacks.forEach(snack => agregarFilaComida(snack, listaSnacks));
        antojitos.forEach(antojitos => agregarFilaComida(antojitos, listaAntojitos));
        mariscos.forEach(mariscos => agregarFilaComida(mariscos, listaMariscos));
        cigarros.forEach(cigarros => agregarFilaComida(cigarros, listaCigarros));
        chidas.forEach(chidas => agregarFilaComida(chidas, listaChidas));
        dulces.forEach(dulces => agregarFilaComida(dulces, listaDulces));
        postres.forEach(postres => agregarFilaComida(postres, listaPostres));
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


// --- FUNCIONES DE VENTAS Y ESTADÍSTICAS ---

async function mostrarVentas() {
    const fechaSeleccionada = document.getElementById("fechaVentas").value;
    const listaVentas = document.getElementById("listaVentas");
    const totalVentas = document.getElementById("totalVentas");

    listaVentas.innerHTML = "";
    totalVentas.textContent = "0.00";

    if (!fechaSeleccionada) return;

    try {
        const apiPedidos = "https://api-ldc.onrender.com/pedidos";
        const res = await fetch(`${apiPedidos}/guardados/${fechaSeleccionada}`);
        if (!res.ok) throw new Error("Error al obtener pedidos guardados");
        const pedidosFiltrados = await res.json();

        pedidosFiltrados.sort((a, b) => a.folio - b.folio);

        let total = 0;
        let totalEfectivo = 0;
        let totalTarjeta = 0;
        let totalPendientes = 0;

        // Contenedor para la cuadrícula de ventas
        const gridVentas = document.createElement("div");
        gridVentas.id = "gridVentasCards"; // Referencia para el CSS
        listaVentas.appendChild(gridVentas);

        pedidosFiltrados.forEach((pedido, index) => {
            const numeroPedido = index + 1;
            total += pedido.total;

            if (pedido.metodo_Pago === "Efectivo") totalEfectivo += pedido.total;
            else if (pedido.metodo_Pago === "Tarjeta") totalTarjeta += pedido.total;
            else totalPendientes += pedido.total;

            const card = document.createElement("div");
            card.classList.add("pedido-card"); // Usamos tu clase original

            card.innerHTML = `
                <strong>Pedido #${numeroPedido}</strong>
                <span><b>Folio:</b> ${pedido.folio}</span>
                <span><b>Mesera:</b> ${pedido.mesera}</span>
                <span><b>Cliente:</b> ${pedido.cliente}</span>
                <span class="text-danger fw-bold">Total: $${pedido.total.toFixed(2)}</span>
                <small class="text-muted">${pedido.fecha}</small>
                <hr>
            `;

            const selectMetodo = document.createElement("select");
            selectMetodo.className = "form-select form-select-sm mb-2";
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
                    alert("Método de pago actualizado ✅");
                    mostrarVentas(); 
                } catch (error) {
                    alert("❌ Error al actualizar");
                }
            });

            const btnImprimir = document.createElement("button");
            btnImprimir.textContent = "Imprimir ticket";
            btnImprimir.className = "btn btn-primary btn-sm w-100";
            btnImprimir.addEventListener("click", () => imprimirTicket(pedido));

            card.appendChild(selectMetodo);
            card.appendChild(btnImprimir);
            gridVentas.appendChild(card);
        });

        totalVentas.textContent = total.toFixed(2);

        // --- SECCIÓN DE ESTADÍSTICAS Y RECOMENDACIONES ---
        await mostrarVentasPorTipo(pedidosFiltrados);

        // Botones de impresión al final
        const divBotones = document.createElement("div");
        divBotones.className = "d-flex flex-wrap gap-2 mt-4 justify-content-center";
        
        const btnResumen = document.createElement("button");
        btnResumen.className = "btn btn-success rounded-pill";
        btnResumen.innerHTML = "🖨️ Resumen Diario";
        btnResumen.onclick = () => imprimirResumenVentas(pedidosFiltrados);

        const btnMeseras = document.createElement("button");
        btnMeseras.className = "btn btn-info rounded-pill text-white";
        btnMeseras.innerHTML = "🖨️ Resumen Meseras";
        btnMeseras.onclick = () => imprimirResumenMeseras(pedidosFiltrados);

        divBotones.append(btnResumen, btnMeseras);
        listaVentas.appendChild(divBotones);

    } catch (error) {
        console.error("Error:", error);
    }
}
// --- FUNCIÓN 1: Gráfica Circular (Categorías) ---
function renderizarGraficaCategorias(datos) {
    const canvas = document.getElementById('chartCategorias');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window.miGraficaCategorias instanceof Chart) window.miGraficaCategorias.destroy();

    const etiquetas = Object.keys(datos);
    const valores = etiquetas.map(cat => datos[cat].total);

    window.miGraficaCategorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: etiquetas,
            datasets: [{
                data: valores,
                backgroundColor: ['#dc3545', '#2d3436', '#ffc107', '#198754', '#0dcaf0', '#6f42c1'],
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

// --- FUNCIÓN 2: Gráfica de Barras (Top Productos) ---
function renderizarGraficaTopProductos(datos) {
    const canvas = document.getElementById('chartProductosTop');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (window.miGraficaProductos instanceof Chart) window.miGraficaProductos.destroy();

    // Extraer todos los productos de todas las categorías y ordenarlos
    let productosArray = [];
    Object.keys(datos).forEach(tipo => {
        Object.keys(datos[tipo].productos).forEach(nombre => {
            productosArray.push({ nombre, cantidad: datos[tipo].productos[nombre] });
        });
    });

    productosArray.sort((a, b) => b.cantidad - a.cantidad);
    const top5 = productosArray.slice(0, 5); // Tomar solo los 5 más vendidos

    window.miGraficaProductos = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: top5.map(p => p.nombre),
            datasets: [{
                label: 'Unidades Vendidas',
                data: top5.map(p => p.cantidad),
                backgroundColor: '#2d3436',
                borderRadius: 8
            }]
        },
        options: {
            indexAxis: 'y', // Barras horizontales
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

/**
 * Muestra las ventas por tipo, genera gráficas y prepara el resumen imprimible.
 */
async function mostrarVentasPorTipo(pedidos) {
    const listaVentas = document.getElementById("listaVentas");
    const contenedorStats = document.getElementById("contenedorStatsCategorias");
    const fechaSeleccionada = document.getElementById("fechaVentas").value;

    // 1. LIMPIEZA INICIAL: Borramos pedidos y el resumen viejo para que no se acumule
    if (!listaVentas) return;
    listaVentas.innerHTML = "";
    const resumenViejo = document.getElementById("resumen-final-ventas");
    if (resumenViejo) resumenViejo.remove();

    try {
        const menuSnapshot = await getDocs(collection(db, "menu"));
        const menuMap = {};
        menuSnapshot.forEach(doc => {
            const data = doc.data();
            menuMap[data.nombre] = data.tipo; 
        });

        const ventasPorTipo = {};
        let productoMasVendido = { nombre: "Ninguno", cantidad: 0 };

        // 2. RENDERIZAR PEDIDOS
        pedidos.forEach(pedido => {
            const cardPedido = document.createElement("div");
            cardPedido.className = "pedido-card shadow-sm";
            
            let itemsHTML = "";
            if (pedido.productos) {
                pedido.productos.forEach(item => {
                    itemsHTML += `
                    <div class="small d-flex justify-content-between">
                        <span>${item.cantidad}x ${item.nombre}</span>
                        <span class="text-muted">$${(item.cantidad * item.precio).toFixed(2)}</span>
                    </div>`;

                    const tipo = menuMap[item.nombre] || "Bebidas";
                    const subtotal = item.cantidad * item.precio;

                    if (!ventasPorTipo[tipo]) ventasPorTipo[tipo] = { total: 0, cantidad: 0, productos: {} };
                    ventasPorTipo[tipo].total += subtotal;
                    ventasPorTipo[tipo].cantidad += item.cantidad;

                    if (!ventasPorTipo[tipo].productos[item.nombre]) ventasPorTipo[tipo].productos[item.nombre] = 0;
                    ventasPorTipo[tipo].productos[item.nombre] += item.cantidad;
                    
                    if (ventasPorTipo[tipo].productos[item.nombre] > productoMasVendido.cantidad) {
                        productoMasVendido = { nombre: item.nombre, cantidad: ventasPorTipo[tipo].productos[item.nombre] };
                    }
                });
            }

            cardPedido.innerHTML = `
                <div class="d-flex justify-content-between border-bottom pb-2 mb-2">
                    <span class="fw-bold text-danger">Mesa ${pedido.mesa || 'S/M'}</span>
                    <span class="badge bg-light text-dark border">${pedido.hora || '--:--'}</span>
                </div>
                <h6 class="fw-bold text-uppercase small mb-2">${pedido.cliente || 'Cliente'}</h6>
                <div class="productos-scroll mb-3" style="max-height: 100px; overflow-y: auto;">
                    ${itemsHTML}
                </div>
                <div class="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <span class="fw-bold">TOTAL:</span>
                    <span class="fw-bold text-success fs-5">$${pedido.total?.toFixed(2) || '0.00'}</span>
                </div>
            `;
            listaVentas.appendChild(cardPedido);
        });

        // 3. RENDERIZAR STATS (Tarjetas pequeñas)
        if (contenedorStats) {
            // Dentro de mostrarVentasPorTipo...
let statsHTML = "";
Object.keys(ventasPorTipo).forEach(tipo => {
    // Convertimos los datos a string para pasarlos a la función de impresión
    const datosCategoria = JSON.stringify(ventasPorTipo[tipo]);
    
    statsHTML += `
        <div class="col-md-3">
            <div class="stats-card-mini h-100 shadow-sm border-0 p-3">
                <small class="text-muted fw-bold text-uppercase">${tipo}</small>
                <h3 class="text-danger fw-bold my-1">$${ventasPorTipo[tipo].total.toFixed(2)}</h3>
                <p class="small text-secondary mb-2">${ventasPorTipo[tipo].cantidad} unidades</p>
                
                <button class="btn btn-outline-danger btn-sm w-100 rounded-pill fw-bold" 
                    onclick='imprimirTicketCategoria("${tipo}", ${datosCategoria})'>
                    🖨️ Imprimir ${tipo}
                </button>
            </div>
        </div>
    `;
});
contenedorStats.innerHTML = statsHTML;
        }

        // 4. ACTUALIZAR GRÁFICAS
        renderizarGraficaCategorias(ventasPorTipo);
        renderizarGraficaTopProductos(ventasPorTipo);

        // 5. INYECTAR RESUMEN FINAL (Fuera del grid de pedidos)
        const resumenFinalHTML = `
            <div id="resumen-final-ventas" class="col-12 mt-4 mb-5">
                <div class="card bg-dark text-white p-4 rounded-4 shadow border-0">
                    <div class="row align-items-center">
                        <div class="col-md-8">
                            <h5 class="fw-bold text-danger">💡 Recomendaciones del Capi</h5>
                            <p class="mb-0">Estrella: <b class="text-warning">${productoMasVendido.nombre}</b> con ${productoMasVendido.cantidad} ventas.</p>
                        </div>
                        <div class="col-md-4 text-md-end">
                            <button class="btn btn-light rounded-pill fw-bold" 
                                onclick='imprimirResumenCarta(${JSON.stringify(ventasPorTipo)}, "${fechaSeleccionada}")'>
                                🖨️ Reporte PDF
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Lo insertamos después de la lista de pedidos
        listaVentas.insertAdjacentHTML('afterend', resumenFinalHTML);

    } catch (error) {
        console.error("Error en estadísticas:", error);
    }
}

// 1. Al final de tu archivo admin.js, agrega la función así:
window.imprimirTicketCategoria = function(tipo, datos) {
    const fechaSeleccionada = document.getElementById("fechaVentas").value || "Sin fecha";
    const ventana = window.open('', '', 'width=400,height=600');
    
    // Generamos las filas de la tabla con los productos de esta categoría
    let productosHTML = "";
    if (datos.productos) {
        Object.keys(datos.productos).forEach(nombreProd => {
            productosHTML += `
                <tr>
                    <td style="text-align: left; padding: 5px;">${nombreProd}</td>
                    <td style="text-align: center; padding: 5px;">${datos.productos[nombreProd]}</td>
                </tr>
            `;
        });
    }

    ventana.document.write(`
        <html>
            <head>
                <title>Corte - ${tipo}</title>
                <style>
                    body { font-family: monospace; padding: 20px; text-align: center; }
                    .logo { width: 80px; filter: grayscale(1); }
                    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                    th, td { border-bottom: 1px dashed #000; }
                    .resumen { text-align: left; margin-top: 15px; font-size: 14px; }
                </style>
            </head>
            <body>
                <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo">
                <h2 style="margin:5px 0;">LOS DOS CARNALES</h2>
                <h3>CORTE: ${tipo.toUpperCase()}</h3>
                <p>Fecha: ${fechaSeleccionada}</p>
                <hr>
                <table>
                    <thead>
                        <tr><th style="text-align: left;">Producto</th><th>Cant</th></tr>
                    </thead>
                    <tbody>${productosHTML}</tbody>
                </table>
                <div class="resumen">
                    <p><strong>Total Unidades:</strong> ${datos.cantidad}</p>
                    <p><strong>Venta Total:</strong> $${datos.total.toFixed(2)}</p>
                </div>
                <p style="margin-top:20px;">#somosLosDosCarnales👬</p>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(() => window.close(), 500);
                    }
                </script>
            </body>
        </html>
    `);
};


/**
 * Función de Impresión Tamaño Carta (PDF)
 */
window.imprimirResumenCarta = function(datos, fecha) {
    const ventana = window.open('', '', 'width=900,height=1000');
    
    let filas = "";
    Object.keys(datos).forEach(tipo => {
        filas += `
            <tr style="background:#f9f9f9;">
                <td style="padding:12px; border:1px solid #ddd; font-weight:bold;">${tipo.toUpperCase()}</td>
                <td style="padding:12px; border:1px solid #ddd; text-align:center;">${datos[tipo].cantidad}</td>
                <td style="padding:12px; border:1px solid #ddd; text-align:right;">$${datos[tipo].total.toFixed(2)}</td>
            </tr>
        `;
    });

    ventana.document.write(`
        <html>
            <head>
                <title>Reporte Administrativo - LDC</title>
                <style>
                    body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
                    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #dc3545; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo { width: 80px; height: 80px; border-radius: 50%; object-fit: cover; }
                    h1 { margin: 0; color: #dc3545; font-size: 28px; text-transform: uppercase; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #333; color: white; padding: 12px; text-align: left; text-transform: uppercase; font-size: 13px; }
                    .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #777; border-top: 1px solid #eee; padding-top: 20px; }
                    .info-meta { margin-bottom: 20px; background: #f4f4f4; padding: 15px; border-radius: 8px; }
                    @media print { .no-print { display: none; } }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <h1>LOS DOS CARNALES</h1>
                        <p style="margin:0; color:#666;">Reporte Diario de Ventas por Categoría</p>
                    </div>
                    <img src="https://felix2114.github.io/front-ldc/images/LosDosCar.jpeg" class="logo">
                </div>
                
                <div class="info-meta">
                    <p style="margin:0;"><strong>Fecha del Reporte:</strong> ${fecha}</p>
                    <p style="margin:5px 0 0 0;"><strong>Generado por:</strong> Administrador </p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Categoría / Tipo</th>
                            <th style="text-align:center;">Cant. Productos</th>
                            <th style="text-align:right;">Total Vendido</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${filas}
                    </tbody>
                </table>

                <div class="footer">
                    <p>Este documento es un comprobante interno de administración para el control de inventarios y ventas diarias.</p>
                    <p>#somosLosDosCarnales 👬</p>
                </div>

                <script>
                    window.onload = function() { 
                        window.print(); 
                        setTimeout(() => window.close(), 1000); 
                    }
                </script>
            </body>
        </html>
    `);
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


    document.getElementById("agregarCigarro").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Cigarro:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "cigarro" })
            });
            cargarDatos();
            alert("Cigarro agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar Cigarro:", error);
        }
    });

    document.getElementById("agregarChida").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Chidas:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "chidas" })
            });
            cargarDatos();
            alert("Chidas agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar chidas:", error);
        }
    });

    document.getElementById("agregarDulce").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Dulce:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "dulce" })
            });
            cargarDatos();
            alert("Dulce agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar Dulce:", error);
        }
    });

    document.getElementById("agregarPostre").addEventListener("click", async () => {
        const nombre = prompt("Nombre del Postre:");
        const precio = parseFloat(prompt("Precio:"));

        if (!nombre || isNaN(precio)) {
            alert("Datos inválidos");
            return;
        }

        try {
            await fetch(apiURL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nombre, precio, tipo: "postre" })
            });
            cargarDatos();
            alert("Postre agregado correctamente.");
        } catch (error) {
            console.error("Error al agregar Postre:", error);
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
