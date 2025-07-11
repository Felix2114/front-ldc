document.addEventListener("DOMContentLoaded", async () => {
    const apiPedidos = "https://api-ldc.onrender.com/pedidos";
    const apiInventario = "https://api-ldc.onrender.com/inventario";
    const listaCocina = document.getElementById("listaCocina");

    let nombresBebidas = [];

    async function cargarDatos() {
        try {
            const [pedidosRes, inventarioRes] = await Promise.all([
                fetch(`${apiPedidos}/entregado/pendientes`),
                fetch(`${apiInventario}/bebidas`)
            ]);

            const [pedidos, inventario] = await Promise.all([
                pedidosRes.json(),
                inventarioRes.json()
            ]);

            // Guardar los nombres de las bebidas para excluirlas después
            nombresBebidas = inventario.map(b => b.nombre.toLowerCase());

            mostrarPedidosPorConfirmar(pedidos);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    }

    function mostrarPedidosPorConfirmar(pedidos) {
        const lista = document.getElementById("listaCocina");
        lista.innerHTML = "";

        // ✅ Ordenar por fecha (los primeros que se levantaron van primero)
        pedidos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

        pedidos.forEach(pedido => {
            // ✅ Filtrar productos que no son bebidas y aún están pendientes
            const productosPendientes = pedido.productos.filter(prod =>
                !nombresBebidas.includes(prod.nombre.toLowerCase()) && prod.estado === false
            );

            if (productosPendientes.length === 0) return;

            const card = document.createElement("div");
            card.className = "card shadow-lg border-0 mb-4";
            card.style.backgroundColor = "#f8f9fa";
            card.style.padding = "20px";
            card.style.borderLeft = "8px solid #007bff";

            const productosList = productosPendientes.map(prod => `
                <li class="list-group-item">${prod.nombre} x${prod.cantidad}</li>
            `).join("");

            card.innerHTML = `
                <div class="card-body">
                    <h4 class="card-title mb-2"><i class="bi bi-table"></i> Mesa: <span class="text-primary">${pedido.mesaId || "Desconocida"}</span></h4>
                    <h5 class="card-subtitle text-muted mb-3">Mesera: ${pedido.mesera}</h5>
                    <p class="mb-3"><strong>Nota:</strong> ${pedido.nota || "<em>Sin nota</em>"}</p>
                    
                    <h5 class="mb-2">Productos:</h5>
                    <ul class="list-group mb-3">
                        ${productosList}
                    </ul>

                    <div class="text-end">
                        <small class="text-muted">Alegrate, estás en Los Dos Carnales</small>
                    </div>
                </div>
            `;

            lista.appendChild(card);
        });
    }

    // ✅ Carga inicial y actualizaciones en tiempo real
    await cargarDatos();
    setInterval(cargarDatos, 5000); // Actualiza cada 5 segundos
});
