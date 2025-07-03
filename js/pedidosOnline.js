document.addEventListener("DOMContentLoaded", async () => {
    const apiURL = "https://tu-api.com";
    let nombreClienteInput = document.getElementById("nombreCliente");
    let listaComidas = document.getElementById("listaComidas");
    let listaBebidas = document.getElementById("listaBebidas");
    let listaSnacks = document.getElementById("listaSnacks");
    let listaOrdenesPendientes = document.getElementById("listaOrdenesPendientes");
    let listaHistorialPedidos = document.getElementById("listaHistorialPedidos");
    let botonConfirmar = document.getElementById("confirmarPedido");
    let pedidoActual = { fecha: new Date().toISOString().split("T")[0], cliente: "", items: [] };
    
    async function cargarMenu() {
        try {
            let response = await fetch(`${apiURL}/menu`);
            let menu = await response.json();
            listaComidas.innerHTML = listaBebidas.innerHTML = listaSnacks.innerHTML = "";
            menu.comidas.forEach(item => agregarItemLista(item, listaComidas));
            menu.bebidas.forEach(item => agregarItemLista(item, listaBebidas));
            menu.snacks.forEach(item => agregarItemLista(item, listaSnacks));
        } catch (error) {
            console.warn("⚠️ Error al obtener el menú.");
        }
    }

    function agregarItemLista(producto, lista) {
        let li = document.createElement("li");
        li.className = "list-group-item d-flex justify-content-between align-items-center";
        li.innerHTML = `${producto.nombre} <span class="badge bg-secondary">$${producto.precio}</span>`;
        let btnAdd = document.createElement("button");
        btnAdd.className = "btn btn-sm btn-success";
        btnAdd.textContent = "+";
        btnAdd.onclick = () => agregarProducto(producto);
        li.appendChild(btnAdd);
        lista.appendChild(li);
    }

    function agregarProducto(producto) {
        let itemIndex = pedidoActual.items.findIndex(item => item.nombre === producto.nombre);
        if (itemIndex !== -1) {
            pedidoActual.items[itemIndex].cantidad++;
        } else {
            pedidoActual.items.push({ nombre: producto.nombre, cantidad: 1, precio: producto.precio });
        }
    }

    botonConfirmar.addEventListener("click", async () => {
        if (!nombreClienteInput.value.trim() || pedidoActual.items.length === 0) {
            alert("⚠️ Ingresa un nombre y selecciona productos antes de confirmar.");
            return;
        }
        pedidoActual.cliente = nombreClienteInput.value.trim();
        let response = await fetch(`${apiURL}/pedidos-online`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(pedidoActual)
        });
        if (response.ok) {
            alert("✅ Pedido confirmado.");
            pedidoActual = { fecha: new Date().toISOString().split("T")[0], cliente: "", items: [] };
            cargarOrdenesPendientes();
            cargarHistorial();
        }
    });

    async function cargarOrdenesPendientes() {
        try {
            let response = await fetch(`${apiURL}/ordenes-online-pendientes`);
            let ordenes = await response.json();
            listaOrdenesPendientes.innerHTML = "";
            ordenes.forEach(pedido => {
                let div = document.createElement("div");
                div.className = "card mt-2";
                div.innerHTML = `<div class="card-body"><h5>Cliente: ${pedido.cliente} - ${pedido.fecha}</h5></div>`;
                listaOrdenesPendientes.appendChild(div);
            });
        } catch (error) {
            console.warn("⚠️ Error al cargar órdenes pendientes.");
        }
    }

    async function cargarHistorial() {
        try {
            let response = await fetch(`${apiURL}/historial-pedidos-online`);
            let historial = await response.json();
            listaHistorialPedidos.innerHTML = "";
            historial.forEach(pedido => {
                let div = document.createElement("div");
                div.className = "card mt-2";
                div.innerHTML = `<div class="card-body"><h5>Cliente: ${pedido.cliente} - ${pedido.fecha}</h5></div>`;
                listaHistorialPedidos.appendChild(div);
            });
        } catch (error) {
            console.warn("⚠️ Error al cargar historial de pedidos.");
        }
    }

    await cargarMenu();
    await cargarOrdenesPendientes();
    await cargarHistorial();
    setInterval(() => {
        cargarOrdenesPendientes();
        cargarHistorial();
    }, 5000);
});
