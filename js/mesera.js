import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";
import { getDocs, updateDoc, doc, getDoc, increment, runTransaction, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

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


let spansEditar = {};


document.addEventListener("DOMContentLoaded", async () => {
    const apiURL = "https://api-ldc.onrender.com";
    const mesasContainer = document.getElementById("mesasContainer");
    const listaComidas = document.getElementById("listaComidas");
    const listaBebidas = document.getElementById("listaBebidas");
    const listaSnacks = document.getElementById("listaSnacks");
    const listaAntojitos = document.getElementById("listaAntojitos");
    const listaMariscos = document.getElementById("listaMariscos");
    //const listaOrdenesPendientes = document.getElementById("listaOrdenesPendientes");
    //const listaHistorialPedidos = document.getElementById("listaHistorialPedidos");
    const botonCancelar = document.getElementById("cancelarPedido");
    const contenidoModalPedido = document.getElementById("contenidoModalPedido");//este
    const botonConfirmar = document.getElementById("confirmarPedido");
    //document.getElementById("confirmarPedido").addEventListener("click", mostrarPedido);
    
    const mesaEditando = document.getElementById("mesaEditando");
     const inputBusqueda = document.getElementById("buscadorProductos");
     const inputBusquedaEditar = document.getElementById("buscadorProductosEditar");

const listasProductos = [
        document.getElementById("listaComidas"),
        document.getElementById("listaBebidas"),
        document.getElementById("listaSnacks"),
        document.getElementById("listaAntojitos"),
        document.getElementById("listaMariscos")
    ];

    const listasProductosEditar = [
        document.getElementById("listaEditarComidas"),
        document.getElementById("listaEditarBebidas"),
        document.getElementById("listaEditarSnacks"),
       document.getElementById("listaEditarAntojitos"),
       document.getElementById("listaEditarMariscos")
    ];

 let pedidoEditar = {
        items: []
     };

      let pedidoActual = {
        items: []
     };

      cargarMesas();
       cargarMenu();
       


        
//setInterval(cargarMesas, 15000);
  

// CARGAR LOS PEDIDOS PENDIENTES Y LISTOS
    // CARGAR DATOS OPTIMIZADO: fetch en paralelo + timeout + render optimizado
async function cargarDatosOptimizado() {
  const controller = new AbortController();
  const timeoutMs = 10000; // 10s (ajusta si quieres)
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Mostrar loader/skeleton rápido
    mostrarSkeletonPedidos(); // implementa una UI ligera (ver nota)

    console.time("fetchPedidos");
    const urls = [
      `${apiURL}/pedidos/estado/pendiente?limit=200`, // usa limit si tu API lo soporta
      `${apiURL}/pedidos/estado/listo?limit=200`
    ];

    // fetch en paralelo
    const responses = await Promise.all(urls.map(u => fetch(u, { signal: controller.signal })));
    clearTimeout(timeoutId);

    // validar responses
    responses.forEach((r, i) => {
      if (!r.ok) throw new Error(`Error en fetch ${i}: ${r.status} ${r.statusText}`);
    });

    // parse JSON en paralelo
    const [pedidosPendientes, pedidosListos] = await Promise.all(responses.map(r => r.json()));
    console.timeEnd("fetchPedidos");

    // render optimizado en chunks para no bloquear UI
    await Promise.all([
      renderPedidosEnChunks(pedidosPendientes, cargarOrdenesOptimizado, document.getElementById('contenedorPendientes')),
      renderPedidosEnChunks(pedidosListos, cargarHistorialDelDiaOptimizado, document.getElementById('contenedorListos'))
    ]);

    mostrarFechaActual();
    console.log("datos cargados");
    quitarSkeletonPedidos(); // quita loader
  } catch (error) {
    clearTimeout(timeoutId);
    console.error("Error al cargar los pedidos:", error);
    quitarSkeletonPedidos();
    // si fue abort por timeout, puedes mostrar mensaje al usuario
    if (error.name === 'AbortError') {
      console.warn("Fetch abortado por timeout");
    }
  }
}



     inputBusqueda.addEventListener("input", () => {
        const filtro = inputBusqueda.value.toLowerCase().trim();

        listasProductos.forEach(lista => {
            const items = lista.querySelectorAll("li");

            items.forEach(item => {
                const texto = item.textContent.toLowerCase();
                if (texto.includes(filtro)) {
                    item.classList.remove("d-none");
                } else {
                    item.classList.add("d-none");
                }
            });
        });
    });

    inputBusquedaEditar.addEventListener("input", () => {
        const filtro = inputBusquedaEditar.value.toLowerCase().trim();

        listasProductosEditar.forEach(lista => {
            const items = lista.querySelectorAll("li");

            items.forEach(item => {
                const texto = item.textContent.toLowerCase();
                if (texto.includes(filtro)) {
                    item.classList.remove("d-none");
                } else {
                    item.classList.add("d-none");
                }
            });
        });
    });


     function cargarHistorialDelDia(pedidosListos) {
        const hoy = new Date();
        const listaHistorial = document.getElementById("listaHistorialPedidos");
        listaHistorial.innerHTML = ""; // Limpiar contenido anterior
    
        pedidosListos.forEach(pedido => {
            const fechaPedido = new Date(pedido.fecha._seconds * 1000);
    
            if (
                fechaPedido.getDate() === hoy.getDate() &&
                fechaPedido.getMonth() === hoy.getMonth() &&
                fechaPedido.getFullYear() === hoy.getFullYear()
            ) {
                const item = document.createElement("li");
                item.textContent = `Mesa ${pedido.mesaId} - Total: $${pedido.total} - Mesera: ${pedido.mesera}`;
                listaHistorial.appendChild(item);
                
            }
        });
    }
async function cargarOrdenes() {
    const respuesta = await fetch(`${apiURL}/pedidos/estado/pendiente`);
    const pedidos = await respuesta.json();

    const hoy = new Date();

    // 👉 Obtener YYYY-MM-DD en hora local
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    const hoyStr = `${yyyy}-${mm}-${dd}`; // "2025-08-23"

    const listaPendientes = document.getElementById("listaOrdenesPendientes");
    listaPendientes.innerHTML = "";

    pedidos.forEach(pedido => {
        // 👇 Ahora comparamos directo con el string que guardamos
        const mismoDia = pedido.fecha === hoyStr;

        if (pedido.estado === "pendiente" && mismoDia) {
            const div = document.createElement("div");
            div.classList.add("card", "mb-2", "p-2");

            // 🧠 Agrupar productos por nombre
            const resumenProductos = {};
            pedido.productos.forEach(prod => {
                if (!resumenProductos[prod.nombre]) {
                    resumenProductos[prod.nombre] = { cantidad: 0, subtotal: 0 };
                }
                resumenProductos[prod.nombre].cantidad += prod.cantidad;
                resumenProductos[prod.nombre].subtotal += prod.subtotal;
            });

            // 🔄 Convertir resumen a lista HTML
            const listaProductosHTML = Object.entries(resumenProductos)
                .map(([nombre, datos]) => `<li>${nombre} x${datos.cantidad} - $${datos.subtotal.toFixed(2)}</li>`)
                .join("");

            div.innerHTML = `
                <div style="text-align: right;">
                    <span class="badge ${pedido.entregado ? 'bg-success' : 'bg-warning'}">
                        Entrega ${pedido.entregado ? 'lista' : 'pendiente'}
                    </span>
                </div>

                <h5>🪑 Mesa ${pedido.mesaId} - Mesera: ${pedido.mesera}</h5>
                <p><strong>Nota:</strong> ${pedido.nota}</p>
                <p><strong>Cliente:</strong> ${pedido.cliente}</p>
                <p><strong>Fecha:</strong> ${pedido.fechaCompleta || pedido.fecha}</p>
                <ul>
                    ${listaProductosHTML}
                </ul>
                <strong>Total:</strong> $${pedido.total.toFixed(2)}
                
                <div class="mt-2 d-flex">
                    <div>
                        <button class="btn btn-warning btn-sm me-1" id="editarPedido${pedido.id}">✏️ Editar</button>
                        <button class="btn btn-success btn-sm me-1" id="ordenEntregada${pedido.id}">✅ Orden Entregada</button>
                        <button class="btn btn-danger btn-sm me-1" id="finalizarAtencion${pedido.id}">🛑 Finalizar Atención</button>
                    </div>
                    <button class="btn btn-danger btn-sm ms-auto" id="eliminarPedido${pedido.id}">🗑️ Eliminar</button>
                </div>
            `;

            listaPendientes.appendChild(div);

            // Eventos de botones
            document.getElementById(`editarPedido${pedido.id}`).addEventListener("click", () => {
                abrirModalEditarPedido(pedido);
            });

            document.getElementById(`ordenEntregada${pedido.id}`).addEventListener("click", async () => {
                try {
                    await fetch(`${apiURL}/pedidos/${pedido.id}/entregado`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" }
                    });
                    alert("Pedido marcado como entregado");
                    cargarOrdenes(); // recargar
                } catch (error) {
                    console.error("Error al marcar como entregado:", error);
                }
            });

            document.getElementById(`eliminarPedido${pedido.id}`).addEventListener("click", async () => {
                const confirmar = confirm("¿Estás seguro de que quieres eliminar este pedido?");
                if (!confirmar) return;

                try {
                    await fetch(`${apiURL}/pedidos/eliminar/${pedido.id}`, {
                        method: "DELETE",
                        headers: { "Content-Type": "application/json" }
                    });
                    alert("Pedido eliminado exitosamente");
                    cargarOrdenes(); // recargar la lista
                } catch (error) {
                    console.error("Error al eliminar pedido:", error);
                    alert("Ocurrió un error al eliminar el pedido.");
                }
            });

            document.getElementById(`finalizarAtencion${pedido.id}`).addEventListener("click", async () => {
                try {
                    await fetch(`${apiURL}/pedidos/${pedido.id}/finalizar`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" }
                    });
                    alert("Atención finalizada y pedido cerrado");
                    cargarOrdenes(); // recargar
                } catch (error) {
                    console.error("Error al finalizar atención:", error);
                }
            });
        }
    });
}



// ACTUALIZAR CANTIDAD DEL PEDIO
    function actualizarCantidad(nombre) {
        const item = pedidoActual.items.find(item => item.nombre === nombre);
        let cantidadSpan = document.querySelector(`span[data-nombre="${nombre}"]`);
        cantidadSpan.textContent = item ? `x${item.cantidad}` : "x0";
    }




    //ELIMINAR PRODUCTO EN LA LISTA
    function eliminarProducto(nombre) {
        let index = pedidoActual.items.findIndex(item => item.nombre === nombre);
        if (index !== -1) {
            if (pedidoActual.items[index].cantidad > 1) {
                pedidoActual.items[index].cantidad--;
            } else {
                pedidoActual.items.splice(index, 1);
            }
            guardarPedidoLocal();
        }
    }

    



    //AGREGAR PRODUCTOS
    function agregarProducto(item) {
        const productoExistente = pedidoActual.items.find(p => p.nombre === item.nombre);
        if (productoExistente) {
            productoExistente.cantidad++;
        } else {
            pedidoActual.items.push({
                nombre: item.nombre,
                cantidad: 1,
                precio: item.precio,
                estado: false
            });
        }
    
        guardarPedidoLocal();
        console.log("Pedido actualizado:", pedidoActual.items);
    }

    
    //console.log("Pedido recuperado:", pedidoActual.items); 

    
     //console.log("id pedido ediar",Pedido editar actualizado.items);
     //Pedido editar actualizado


     async function cargarMenuEditar(pedido) {
    try {
        const [menuResponse, inventarioResponse] = await Promise.all([
            fetch(`${apiURL}/menu`),
            fetch(`${apiURL}/inventario/bebidas`)
        ]);

        if (!menuResponse.ok || !inventarioResponse.ok) {
            throw new Error("Error al obtener los datos del menú o inventario.");
        }

        const menu = await menuResponse.json();
        const inventario = await inventarioResponse.json();

        if (!Array.isArray(menu) || !Array.isArray(inventario)) {
            throw new Error("Los datos recibidos no son arrays.");
        }

        const listaEditarComidas = document.getElementById("listaEditarComidas");
        const listaEditarBebidas = document.getElementById("listaEditarBebidas");
        const listaEditarSnacks = document.getElementById("listaEditarSnacks");
        const listaEditarAntojitos = document.getElementById("listaEditarAntojitos");
        const listaEditarMariscos = document.getElementById("listaEditarMariscos");

        listaEditarComidas.innerHTML = '';
        listaEditarBebidas.innerHTML = '';
        listaEditarSnacks.innerHTML = '';
        listaEditarAntojitos.innerHTML = '';
        listaEditarMariscos.innerHTML = '';

        // ✅ Cargar comidas y snacks
        menu.forEach(item => {
            const cantidadInicial = pedidoEditar.items
                .filter(p => p.nombre === item.nombre)
                .reduce((total, p) => total + p.cantidad, 0);

            if (item.tipo === "comida") {
                agregarItemsListaEditar([item], listaEditarComidas, cantidadInicial);
            } else if (item.tipo === "snack") {
                agregarItemsListaEditar([item], listaEditarSnacks, cantidadInicial);
            }
            else if (item.tipo === "antojito") {
                agregarItemsListaEditar([item], listaEditarAntojitos, cantidadInicial);
            }
            else if (item.tipo === "marisco") {
                agregarItemsListaEditar([item], listaEditarMariscos, cantidadInicial);
            }
        });

        // ✅ Cargar bebidas
        inventario.forEach(item => {
            const bebida = { nombre: item.nombre, precio: item.precio };
            const cantidadInicial = pedidoEditar.items
                .filter(p => p.nombre === bebida.nombre)
                .reduce((total, p) => total + p.cantidad, 0);

            agregarItemsListaEditar([bebida], listaEditarBebidas, cantidadInicial);
        });

    } catch (error) {
        console.warn("⚠️ Error al obtener el menú para edición:", error);
    }
}

/////////////////////////////////////////////////////////////////////////////7

// 🗂️ Mapa global de referencias a spans por producto
if (!window.spansEditar) window.spansEditar = {};

// 👉 Abrir modal de edición
function abrirModalEditarPedido(pedido) {
    pedidoEditar.id = pedido.id;
    pedidoEditar.mesa = pedido.mesaId;
    pedidoEditar.mesera = pedido.mesera;
    pedidoEditar.nota = pedido.nota || "";

    // ✅ Solo productos no entregados
    pedidoEditar.items = pedido.productos
        .filter(prod => prod.estado === false)
        .map(prod => ({
            nombre: prod.nombre,
            comidaId: prod.comidaId || prod.id,
            cantidad: prod.cantidad,
            precio: prod.precio || prod.subtotal,
            estado: false
        }));

    document.getElementById('notaEditar').value = pedidoEditar.nota;
    document.getElementById('mesaEditando').textContent = pedido.mesaId;

    cargarMenuEditar(pedido);

    const modal = new bootstrap.Modal(document.getElementById('editarPedidoModal'));
    modal.show();
}

// 👉 Eliminar producto
function eliminarProductoEditar(nombre) {
    let index = pedidoEditar.items.findIndex(item => item.nombre === nombre);
    if (index !== -1) {
        if (pedidoEditar.items[index].cantidad > 1) {
            pedidoEditar.items[index].cantidad--;
        } else {
            pedidoEditar.items.splice(index, 1);
        }
        guardarPedidoLocal();
    }
}

// 👉 Agregar producto
function agregarProductoEditar(item) {
    const productoExistente = pedidoEditar.items.find(p => 
        p.nombre === item.nombre && 
        p.precio === item.precio
    );

    if (productoExistente) {
        if (productoExistente.estado === false) {
            productoExistente.cantidad++;
        } else {
            pedidoEditar.items.push({
                id: item.id || generarIdUnico(),
                nombre: item.nombre,
                cantidad: 1,
                precio: item.precio,
                estado: false
            });
        }
    } else {
        pedidoEditar.items.push({
            id: item.id || generarIdUnico(),
            nombre: item.nombre,
            cantidad: 1,
            precio: item.precio,
            estado: false
        });
    }

    guardarPedidoLocal();
}

// 👉 Actualizar cantidad en todos los spans del producto
function actualizarCantidadEditar(nombre) {
    const totalCantidad = pedidoEditar.items
        .filter(item => item.nombre === nombre)
        .reduce((suma, item) => suma + item.cantidad, 0);

    if (spansEditar[nombre]) {
        spansEditar[nombre].forEach(span => {
            span.textContent = "x" + totalCantidad;
        });
    }
}

// 👉 Crear lista de productos para editar
function agregarItemsListaEditar(items, lista, cantidadInicial = 0) {
    if (!Array.isArray(items)) {
        console.warn("⚠️ Error: `items` no es un array válido.");
        return;
    }

    items.forEach(item => {
        let li = document.createElement("li");
        li.classList.add("list-group-item", "list-item");

        let nombre = document.createElement("span");
        nombre.textContent = item.nombre;
        nombre.classList.add("item-name");

        let precio = document.createElement("span");
        precio.classList.add("badge", "badge-price");
        precio.textContent = `$${item.precio}`;

        let cantidadSpan = document.createElement("span");
        cantidadSpan.classList.add("ms-2", "fw-bold");
        cantidadSpan.setAttribute("data-nombre", item.nombre);
        cantidadSpan.textContent = `x${cantidadInicial}`;

        // Guardar referencia global
        if (!spansEditar[item.nombre]) spansEditar[item.nombre] = [];
        spansEditar[item.nombre].push(cantidadSpan);

        let btnAdd = document.createElement("button");
        btnAdd.classList.add("btn", "btn-sm", "btn-success", "ms-2", "add-button");
        btnAdd.textContent = "+";
        btnAdd.onclick = () => {
            btnAdd.disabled = true; // evitar spam
            let cantidad = parseInt(cantidadSpan.textContent.replace("x", "")) + 1;
            cantidadSpan.textContent = "x" + cantidad;

            agregarProductoEditar({ nombre: item.nombre, precio: item.precio });
            actualizarCantidadEditar(item.nombre);

            setTimeout(() => btnAdd.disabled = false, 150); // reactivar rápido
        };

        let btnRemove = document.createElement("button");
        btnRemove.classList.add("btn", "btn-sm", "btn-danger", "ms-2", "remove-button");
        btnRemove.textContent = "-";
        btnRemove.onclick = () => {
            btnRemove.disabled = true;
            let cantidad = parseInt(cantidadSpan.textContent.replace("x", ""));
            if (cantidad > 0) {
                cantidad--;
                cantidadSpan.textContent = "x" + cantidad;

                eliminarProductoEditar(item.nombre);
                actualizarCantidadEditar(item.nombre);
            }
            setTimeout(() => btnRemove.disabled = false, 150);
        };

        let container = document.createElement("div");
        container.classList.add("d-flex", "align-items-center");
        container.appendChild(precio);
        container.appendChild(btnRemove);
        container.appendChild(cantidadSpan);
        container.appendChild(btnAdd);

        li.appendChild(nombre);
        li.appendChild(container);
        lista.appendChild(li);
    });
}




     //AGREGAR ITEMS A LA LISTA DE MENU 
    function agregarItemsLista(items, lista) {
        if (!Array.isArray(items)) {
            console.warn("⚠️ Error: `items` no es un array válido.");
            return;
        }
    
        items.forEach(item => {
            let li = document.createElement("li");
            li.classList.add("list-group-item", "list-item");
    
            let nombre = document.createElement("span");
            nombre.textContent = item.nombre;
            nombre.classList.add("item-name");
    
            let precio = document.createElement("span");
            precio.classList.add("badge", "badge-price");
            precio.textContent = `$${item.precio}`;
    
            let cantidadSpan = document.createElement("span");
            cantidadSpan.classList.add("ms-2", "fw-bold");
            cantidadSpan.setAttribute("data-nombre", item.nombre);
            cantidadSpan.textContent = "x0";
    
            let btnAdd = document.createElement("button");
            btnAdd.classList.add("btn", "btn-sm", "btn-success", "ms-2", "add-button");
            btnAdd.textContent = "+";
            btnAdd.onclick = () => {
                agregarProducto({ nombre: item.nombre, precio: item.precio });
                actualizarCantidad(item.nombre);
            };
    
            let btnRemove = document.createElement("button");
            btnRemove.classList.add("btn", "btn-sm", "btn-danger", "ms-2", "remove-button");
            btnRemove.textContent = "-";
            btnRemove.onclick = () => {
                eliminarProducto(item.nombre);
                actualizarCantidad(item.nombre);
            };
    
            let container = document.createElement("div");
            container.classList.add("d-flex", "align-items-center");
            container.appendChild(precio);
            container.appendChild(btnRemove);
            container.appendChild(cantidadSpan);
            container.appendChild(btnAdd);
    
            li.appendChild(nombre);
            li.appendChild(container);
            lista.appendChild(li);
        });
    }
    
    document.getElementById("enviarPedido").addEventListener("click", () => {
        enviarPedido(pedidoActual); // asegúrate de que `pedidoActual` esté actualizado
    });
    






    function generarIdUnico() {
    return Math.random().toString(36).substr(2, 9); // por ejemplo: "a1b2c3d4e"
}

   document.getElementById("guardarEdicion").addEventListener("click", async () => {
    try {
        const pedidoId = pedidoEditar.id; // Asegúrate de tener el ID del pedido en el objeto `pedidoActual`

        if (!pedidoId) {
            alert("No se puede guardar porque falta el ID del pedido.");
            return;
        }

         const nuevaNota = document.getElementById("notaEditar").value.trim();
        const productosMap = {};

pedidoEditar.items.forEach((item) => {
    const key = item.nombre; // O usa item.comidaId si es mejor identificador

    if (productosMap[key]) {
        // Ya existe: sumar cantidades
        productosMap[key].cantidad += item.cantidad;
    } else {
        productosMap[key] = {
            id: item.id || generarIdUnico(),
            nombre: item.nombre,
            cantidad: item.cantidad,
            precio: item.precio,
        };
    }
});

const productosFormateados = Object.values(productosMap);
       const response = await fetch(`${apiURL}/pedidos/modificar-productos/${pedidoId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                 productos: 
                 productosFormateados,
                nota: nuevaNota }),
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Error desconocido");
        }

       // console.log(productosFormateados);
        alert("✅ Pedido actualizado correctamente");
        console.log("Respuesta del servidor:", result);
        window.location.reload();
    } catch (error) {
        console.error("❌ Error al guardar la edición del pedido:", error);
        alert("Ocurrió un error al guardar la edición del pedido.");
    }
});

    
    
    
    
   
    
    


//BOTON AGREGAR PEDIDO
   
        document.querySelectorAll(".boton-agregar").forEach((boton) => {
            boton.removeEventListener("click", agregarProducto); // Elimina cualquier evento previo
            boton.addEventListener("click", function () {
                agregarProducto(this.dataset.id);
            });
        });
  
    

    if (!botonConfirmar || !botonCancelar) {
        console.error("⚠️ Error: No se encontraron los botones en el DOM.");
        return;
    }



    // MOSTRAR FECHA ACTUAL
    function mostrarFechaActual() {
        const fechaElemento = document.getElementById("fechaActual");
        const hoy = new Date();
    
        const opciones = { year: 'numeric', month: 'long', day: 'numeric' };
        const fechaFormateada = hoy.toLocaleDateString('es-ES', opciones);
    
        if (fechaElemento) {
            fechaElemento.textContent = `Hoy es: ${fechaFormateada}`;
        }
    }
    


       //BOTON PRINCIPAL CONFIRMAR PEDIDO
    botonConfirmar.addEventListener("click", () => {
        if (pedidoActual.items.length === 0) {
            alert("⚠️ No hay productos en el pedido.");
            return;
        }
    
        //  Limpiar contenido previo antes de actualizar
        contenidoModalPedido.innerHTML = "";
    
        // Generar la lista de productos en el modal
        pedidoActual.items.forEach(item => {
            let div = document.createElement("div");
            div.classList.add("d-flex", "justify-content-between", "border-bottom", "p-2");
            div.innerHTML = `<span>${item.nombre} x${item.cantidad}</span> <strong>$${item.precio * item.cantidad}</strong>`;
            contenidoModalPedido.appendChild(div);
        });
    
        // Mostrar el modal correctamente
        const modalPedido = new bootstrap.Modal(document.getElementById("modalPedido"));
        modalPedido.show();
    });
    


    //BOTON PRINCIPAL CANCELAR PEDIDO
    botonCancelar.addEventListener("click", () => {
        if (confirm("¿Seguro que quieres cancelar el pedido?")) {
            limpiarPedido();
        }
    });


    //LIMPIAR PEDIDO
    function limpiarPedido() {
        pedidoActual = { fecha: new Date().toISOString().split("T")[0], mesa: null, mesera: "", items: [] };
        document.getElementById("mesaSeleccionada").textContent = "";
        mostrarPedido();
        guardarPedidoLocal();
    }
       
   
    //CARGAR MESAS
   async function cargarMesas() {
    try {
        const response = await fetch(`${apiURL}/mesas`);
        const mesas = await response.json();

        // Limpiar el contenedor de mesas
        mesasContainer.innerHTML = "";

        // Filtrar y ordenar las mesas disponibles
        const mesasDisponibles = mesas
            .filter(m => m.disponible)
            .sort((a, b) => a.numero - b.numero);

        if (mesasDisponibles.length === 0) {
            mesasContainer.innerHTML = `
                <div class="alert alert-warning" role="alert">
                    No hay mesas disponibles en este momento. 🪑⏳
                </div>`;
            return;
        }

        // Crear botones para cada mesa disponible
        mesasDisponibles.forEach(mesa => {
            const btnMesa = document.createElement("button");
            btnMesa.className = "mesa-btn m-2"; // Usa tu clase personalizada
            btnMesa.textContent = `Mesa ${mesa.numero}`;
            btnMesa.setAttribute("aria-label", `Seleccionar mesa ${mesa.numero}`);
            btnMesa.onclick = () => seleccionarMesa(mesa.numero);
            mesasContainer.appendChild(btnMesa);
        });

    } catch (error) {
        console.error("⚠️ Error al cargar las mesas:", error);
        mesasContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                Ocurrió un error al cargar las mesas. Intenta nuevamente más tarde. ❌
            </div>`;
    }
}



    function seleccionarMesa(numero) {
        if (!numero) {
            console.warn("⚠️ Número de mesa inválido.");
            return;
        }
        pedidoActual.mesa = numero;
        document.getElementById("mesaSeleccionada").textContent = `Mesa ${numero}`;
        document.getElementById("pedidoContenido").classList.remove("d-none");
        guardarPedidoLocal();
    }

   


    


    //CARGAR MENU
    async function cargarMenu() {
        try {
            const [menuResponse, inventarioResponse] = await Promise.all([
                fetch(`${apiURL}/menu`),
                fetch(`${apiURL}/inventario/bebidas`)
            ]);
    
            if (!menuResponse.ok || !inventarioResponse.ok) {
                throw new Error("Error al obtener los datos del menú o inventario.");
            }
    
            const menu = await menuResponse.json();
            const inventario = await inventarioResponse.json();
    
            if (!Array.isArray(menu) || !Array.isArray(inventario)) {
                throw new Error("Los datos recibidos no son arrays.");
            }
    
            menu.forEach(item => {
                if (item.tipo === "comida" && !document.querySelector(`[data-nombre="${item.nombre}"]`)) {
                    agregarItemsLista([item], listaComidas);
                } else if (item.tipo === "snack" && !document.querySelector(`[data-nombre="${item.nombre}"]`)) {
                    agregarItemsLista([item], listaSnacks);
                }
                else if (item.tipo === "antojito" && !document.querySelector(`[data-nombre="${item.nombre}"]`)) {
                    agregarItemsLista([item], listaAntojitos);
                }
                else if (item.tipo === "marisco" && !document.querySelector(`[data-nombre="${item.nombre}"]`)) {
                    agregarItemsLista([item], listaMariscos);
                }
            });
    
            inventario.forEach(item => {
                const bebida = { nombre: item.nombre, precio: item.precio };
                if (!document.querySelector(`[data-nombre="${bebida.nombre}"]`)) {
                    agregarItemsLista([bebida], listaBebidas);
                }
            });
    
        } catch (error) {
            console.warn("⚠️ Error al obtener el menú:", error);
        }
    }

    async function obtenerYActualizarFolio() {
    const folioRef = doc(db, "config", "folio");

    const nuevoFolio = await runTransaction(db, async (transaction) => {
        const folioDoc = await transaction.get(folioRef);

        if (!folioDoc.exists()) {
            throw "Documento de folio no existe.";
        }

        const data = folioDoc.data();
        const ultimoFolio = data.ultimoFolio || 0;
        const siguienteFolio = ultimoFolio + 1;

        transaction.update(folioRef, { ultimoFolio: siguienteFolio });

        return siguienteFolio;
    });

    return nuevoFolio;
}

     


    //ENVIAR PEDIDO POR EL MODAL A LA BASE DE DATOS
 // ENVIAR PEDIDO POR EL MODAL A LA BASE DE DATOS
async function enviarPedido(pedido) {
    const overlay = document.getElementById("overlay");
    const overlayContent = document.getElementById("overlayContent");

    try {
        // Mostrar overlay con animación de carga
        overlay.style.display = "flex";
        overlayContent.innerHTML = `<div class="loader"></div><p class="mt-3">Enviando pedido...</p>`;

        pedido.mesera = document.getElementById("nombreMesera").value;
        pedido.cliente = document.getElementById("nombreCliente").value;
        pedido.nota = document.getElementById("notaPedido").value;

        if (!pedido.mesa) {
            overlay.style.display = "none";
            alert("Selecciona una mesa antes de enviar el pedido.");
            return;
        }

        const total = pedido.items.reduce((acc, item) => acc + item.cantidad * item.precio, 0);

        // ✅ Generar folio justo antes de guardar
        const folio = await obtenerYActualizarFolio();
     const ahora = new Date();

// --- Fecha solo (YYYY-MM-DD) en horario local ---
const year = ahora.getFullYear();
const month = String(ahora.getMonth() + 1).padStart(2, "0"); // getMonth() empieza en 0
const day = String(ahora.getDate()).padStart(2, "0");
const fecha = `${year}-${month}-${day}`;   // ej: "2025-08-22"

// --- Fecha completa legible (local) ---
const fechaCompleta = ahora.toLocaleString("es-MX", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true
});

// Guardar en Firestore
const pedidoDocRef = await addDoc(collection(db, "pedidos"), {
  folio: folio,
  entregado: false,
  estado: "pendiente",
  fecha: fecha,               // ✅ siempre YYYY-MM-DD local
  fechaCompleta: fechaCompleta, // ✅ legible para mostrar
  mesaId: pedido.mesa.toString(),
  mesera: pedido.mesera || "Anónimo",
  cliente: pedido.cliente || "",
  nota: pedido.nota || "",
  total: total,
  guardado: false,
  descuento: "",
  metodo_Pago: "",
});


        const productosRef = collection(pedidoDocRef, "productos");

        for (const item of pedido.items) {
            await addDoc(productosRef, {
                nombre: item.nombre,
                cantidad: item.cantidad,
                precio: item.precio,
                subtotal: item.cantidad * item.precio,
                estado: false,
                
            });

            await actualizarInventarioBebida(item.nombre, item.cantidad);
        }

        await actualizarEstadoMesa(pedido.mesa);

        // Mostrar palomita de éxito
        overlayContent.innerHTML = `<div class="checkmark">✅</div><p class="mt-3">Pedido enviado</p>`;

        // Recargar después de 1.5 segundos
        setTimeout(() => {
            window.location.reload();
        }, 1500);

    } catch (error) {
        console.error("❌ Error al enviar el pedido:", error);
        overlay.style.display = "none";
        alert("Ocurrió un error al enviar el pedido.");
    }
}



   


    //RESTAR A BEBIDAS
    async function actualizarInventarioBebida(nombre, cantidadUsada) {
        try {
            const bebidasSnap = await getDocs(collection(db, "inventario_bebidas"));
            const bebidaDoc = bebidasSnap.docs.find(doc => doc.data().nombre === nombre);
    
            if (bebidaDoc) {
                const bebidaRef = doc(db, "inventario_bebidas", bebidaDoc.id);
                const nuevaCantidad = bebidaDoc.data().cantidad - cantidadUsada;
    
                await updateDoc(bebidaRef, {
                    cantidad: nuevaCantidad >= 0 ? nuevaCantidad : 0
                });
            }
        } catch (err) {
            console.warn(`⚠️ No se pudo actualizar inventario para ${nombre}:`, err);
        }
    }

    //ESTADO DE MESA OCUPADA O LISTA
    async function actualizarEstadoMesa(numeroMesa) {
        try {
            const mesasSnap = await getDocs(collection(db, "mesas"));
            const mesaDoc = mesasSnap.docs.find(doc => doc.data().numero == numeroMesa);
    
            if (mesaDoc) {
                const mesaRef = doc(db, "mesas", mesaDoc.id);
                await updateDoc(mesaRef, {
                    disponible: false
                });
            }
        } catch (err) {
            console.warn(`⚠️ No se pudo marcar la mesa ${numeroMesa} como ocupada:`, err);
        }
    }
    
  

    // función auxiliar para escapar texto (seguridad básica)
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function mostrarPedido() {
    console.time("mostrarPedido");

    // Asegurarnos de usar el pedidoActual global
    if (!window.pedidoActual || !Array.isArray(window.pedidoActual.items)) {
        window.pedidoActual = { items: [] };
    }

    // Limpiar una vez
    contenidoModalPedido.innerHTML = "";

    if (window.pedidoActual.items.length === 0) {
        contenidoModalPedido.innerHTML = "<p>No hay productos en el pedido.</p>";
        const modalPedidoVacio = new bootstrap.Modal(document.getElementById("modalPedido"));
        modalPedidoVacio.show();
        console.timeEnd("mostrarPedido");
        return;
    }

    // Generar HTML de golpe (mucho más rápido que appendChild dentro del loop)
    const html = window.pedidoActual.items.map(item => {
        const nombre = escapeHtml(item.nombre || "");
        const cantidad = item.cantidad || 0;
        const subtotal = ((item.precio || 0) * cantidad).toFixed(2);
        return `<div class="d-flex justify-content-between border-bottom p-2">
                    <span>${nombre} x${cantidad}</span>
                    <strong>$${subtotal}</strong>
                </div>`;
    }).join("");

    contenidoModalPedido.innerHTML = html;

    const modalPedido = new bootstrap.Modal(document.getElementById("modalPedido"));
    modalPedido.show();

    console.timeEnd("mostrarPedido");
}


    
    //HAY QUE CORREGIR, MARCA ERRO SI LO QUITO
    function guardarPedidoLocal() {
        try {} catch (error) {
            console.warn("⚠️ Error al guardar en localStorage.", error);
        }
    }
    






    async function actualizarDatos() {
  await Promise.all([
    cargarMenu(),
    cargarMesas(),
    cargarOrdenes()
  ]);

  setTimeout(actualizarDatos, 15000);   // espera 15s y vuelve a ejecutar
}

actualizarDatos(); // inicia la primera vez




    
});
