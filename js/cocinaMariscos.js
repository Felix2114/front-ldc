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

            mostrarPedidosMariscos(pedidos);
        } catch (error) {
            console.error("Error al cargar datos:", error);
        }
    }

    
function mostrarPedidosMariscos(pedidos) {
    const lista = document.getElementById("listaCocina");
    lista.innerHTML = "";

    // Normalizador: minusculas, quitar acentos, quitar caracteres no alfanuméricos, trim
    const normalizeText = (s) => {
        if (!s) return "";
        return s
            .toString()
            .toLowerCase()
            .normalize('NFD')                     // separar acentos
            .replace(/[\u0300-\u036f]/g, '')     // quitar acentos
            .replace(/[^a-z0-9\s]/g, '')         // quitar puntuación
            .trim();
    };

    // Tu lista original (puedes mantenerla tal cual)
    const nombresMariscos = [
      "CALDO DE CAMARON", "ORD TOSTADA CAMARON", "COCTEL BOLA", "MOJARRA ", "ORD TACOS DE PULPO", "ORD TACOS DE CAMARON",
      "CAMARONES ZARANDEADOS", "ORD TOSTADA JAIBA", "FILETE DE PESCADO", "COCTEL COPA", "COCTEL CHICO", "VUELVE A LA VIDA",
      "MOJARRAS CHICAS", "ORD. TOSTADA CAZON", "CAMARONES CHILPAYADOS", "JAIBAS ENCHIPOTLADAS", "ENSALADA DE MARISCOS",
      "MOJARRA PROMOCION", "CALDO DE ROBALO"
    ];

    // Normaliza la lista una vez (más eficiente)
    const nombresMariscosNorm = nombresMariscos.map(normalizeText);

    // Normaliza la lista de bebidas (asegúrate que nombresBebidas exista en el scope y provenga del fetch)
    const nombresBebidasNorm = (typeof nombresBebidas !== "undefined" && Array.isArray(nombresBebidas))
        ? nombresBebidas.map(normalizeText)
        : [];

    // ✅ Ordenar por fecha (los primeros que se levantaron van primero)
    pedidos.sort((a, b) => new Date(a.fecha) - new Date(b.fecha));

    pedidos.forEach(pedido => {
        // Filtrar productos que sean mariscos (según nombre), no bebidas y pendientes
        const productosPendientes = pedido.productos.filter(prod => {
            const nombreNorm = normalizeText(prod.nombre);

            const esMarisco = nombresMariscosNorm.some(m => m && nombreNorm.includes(m));
            const esBebida = nombresBebidasNorm.includes(nombreNorm);

            // debug opcional (descomenta si quieres ver)
            // console.log("DEBUG filtro:", { nombre: prod.nombre, nombreNorm, esMarisco, esBebida, estado: prod.estado });

            return esMarisco &&
                   !esBebida &&
                   (prod.estado === false || prod.estado === "false" || prod.estado === 0);
        });

        if (productosPendientes.length === 0) return;

        const card = document.createElement("div");
        card.className = "card shadow-lg border-0 mb-4";
        card.style.backgroundColor = "#f8f9fa";
        card.style.padding = "30px";
        card.style.borderLeft = "10px solid #007bff";
        card.style.fontSize = "1.6rem";

        const productosList = productosPendientes.map(prod => `
            <li class="list-group-item" style="font-size: 1.8rem;">${prod.nombre} x${prod.cantidad}</li>
        `).join("");

        card.innerHTML = `
            <div class="card-body">
                <h2 class="card-title mb-3"><i class="bi bi-table"></i> Mesa: <span class="text-primary">${pedido.mesaId || "Desconocida"}</span></h2>
                <h3 class="card-subtitle text-dark mb-2"> Mesera: ${pedido.mesera}</h3>
                <h3 class="mb-2" style="color: #c0392b; font-weight: bold;"> Cliente: ${pedido.cliente || "<em>Sin nombre</em>"}</h3>
                <p class="mb-3" style="font-size: 1.5rem;"><strong> Nota:</strong> ${pedido.nota || "<em>Sin nota</em>"}</p>

                <h3 class="mb-2">🦐 Productos (Mariscos):</h3>
                <ul class="list-group mb-3">
                    ${productosList}
                </ul>

                <div class="text-end">
                    <small class="text-muted" style="font-size: 1.3rem;"> Alegrate, estás en Los Dos Carnales</small>
                </div>
            </div>
        `;

        lista.appendChild(card);
    });
}

    // ✅ Carga inicial y actualizaciones en tiempo real
    await cargarDatos();
    setInterval(cargarDatos, 15000); // Actualiza cada 5 segundos
});
