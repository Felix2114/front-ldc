// js/inventario.js

export let bebidasGlobal = [];
//const apiInventario = "http://localhost:5000/inventario";
const apiInventario = "https://api-ldc.onrender.com/inventario";
//const apiTipoBebidas = "http://localhost:5000/tipoBebidas";
const apiTipoBebidas = "https://api-ldc.onrender.com/tipoBebidas";


export async function cargarTiposBebidas(datosPrecarregados = null) {
  const nav = document.getElementById("navTiposBebida");
  if (!nav) return; 
  
  nav.innerHTML = "";
  let tipos = [];

  try {
    if (datosPrecarregados) {
      tipos = Array.isArray(datosPrecarregados.tipos) ? datosPrecarregados.tipos : datosPrecarregados;
    } else {
      const res = await fetch(`${apiTipoBebidas}/bebidas/tipos-bebidas`);
      const data = await res.json();
      tipos = Array.isArray(data.tipos) ? data.tipos : data;
    }

    if (!tipos || tipos.length === 0) {
      nav.innerHTML = `<li class="nav-item"><span class="text-muted px-3">No hay tipos</span></li>`;
      return;
    }

    // 1. Renderizar botones en el NAV
    tipos.forEach((tipo, index) => {
      nav.insertAdjacentHTML("beforeend", `
        <li class="nav-item">
          <button class="nav-link ${index === 0 ? "active" : ""}" data-tipo="${tipo.nombre}">
            ${tipo.nombre}
          </button>
        </li>`);
    });

    // 2. Eventos de click para filtrar
    nav.querySelectorAll("button").forEach(btn => {
      btn.addEventListener("click", () => {
        nav.querySelectorAll(".nav-link").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        filtrarBebidasPorTipo(btn.dataset.tipo);
      });
    });

    // 🔥 AGREGAR AQUÍ: Llenar el select del modal "Nueva Bebida"
    const select = document.getElementById("selectTipoBebida");
    if (select) {
        select.innerHTML = '<option value="">Selecciona un tipo...</option>';
        tipos.forEach(tipo => {
            select.insertAdjacentHTML("beforeend", `
                <option value="${tipo.nombre}">${tipo.nombre}</option>
            `);
        });
    }

  } catch (error) {
    console.error("❌ Error en cargarTiposBebidas:", error);
  }
}

/* ======================
   BEBIDAS
====================== */

export function setBebidasGlobal(bebidas) {
    bebidasGlobal = bebidas;
}

export function filtrarBebidasPorTipo(tipo) {
    const filtradas = bebidasGlobal.filter(
        b => b.tipo?.nombre === tipo
    );

    mostrarInventario(filtradas);
}

function mostrarInventario(bebidas) {
    const tbody = document.getElementById("tablaBebidas");
    tbody.innerHTML = "";

    bebidas.forEach(b => {
        tbody.insertAdjacentHTML("beforeend", renderBebida(b));
    });
}

// Modifica tu función de renderizado
function renderBebida(bebida) {
    const statusClass = bebida.activo ? "badge bg-success" : "badge bg-secondary";
    const statusText = bebida.activo ? "Activo" : "Inactivo";

    return `
        <tr class="${!bebida.activo ? 'opacity-50' : ''}">
            <td>
                <div class="fw-bold text-dark">${bebida.nombre}</div>
                <span class="${statusClass}" style="font-size: 0.7rem;">${statusText}</span>
            </td>
            <td>
                <span class="badge bg-light text-dark border">${bebida.stock} u.</span>
            </td>
            <td class="fw-bold">$${bebida.precio}</td>
            <td>
                <div class="btn-group btn-group-sm">
                    <button class="btn btn-outline-dark" onclick="prepararEdicion('${bebida.id}')" title="Editar">
                        ✏️
                    </button>
                    
                    <button class="btn ${bebida.activo ? 'btn-outline-warning' : 'btn-outline-success'}" 
                            onclick="toggleEstado('${bebida.id}', ${bebida.activo})" 
                            title="${bebida.activo ? 'Deshabilitar' : 'Habilitar'}">
                        ${bebida.activo ? '🚫' : '✅'}
                    </button>

                    <button class="btn btn-outline-danger" 
                            onclick="prepararEliminacion('${bebida.id}')" 
                            title="Eliminar">
                        🗑️
                    </button>
                </div>
            </td>
        </tr>
    `;
}

// Función para habilitar/deshabilitar
window.toggleEstado = async (id, estadoActual) => {
    try {
        const res = await fetch(`${apiInventario}/bebidas/${id}/estado`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ activo: !estadoActual })
        });
        if (res.ok) location.reload();
    } catch (error) {
        console.error("Error al cambiar estado", error);
    }
};

// Función para abrir modal de edición con datos cargados
window.prepararEdicion = (id) => {
    const bebida = bebidasGlobal.find(b => b.id === id);
    if (!bebida) return;

    document.getElementById("editBebidaId").value = id;
    document.getElementById("editNombreBebida").value = bebida.nombre;
    document.getElementById("editPrecioBebida").value = bebida.precio;
    document.getElementById("editStockBebida").value = bebida.stock;
    
    // Llenar el select de edición dinámicamente
    const select = document.getElementById("editSelectTipoBebida");
    const selectPrincipal = document.getElementById("selectTipoBebida");
    
    // Copiamos las opciones del select de "Agregar" al de "Editar"
    select.innerHTML = selectPrincipal.innerHTML;
    select.value = bebida.tipo.nombre;

    const modal = new bootstrap.Modal(document.getElementById('modalEditarBebida'));
    modal.show();
};


// 👇 ESTA FUNCIÓN ES LA CLAVE
export async function guardarTipoBebida() {
  const input = document.getElementById("nombreTipoBebida");
  const nombre = input.value.trim();

  if (!nombre) {
    alert("Ingresa un nombre de tipo");
    return;
  }

  try {
    const res = await fetch(`${apiTipoBebidas}/bebidas/agregar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ nombre })
    });

    if (!res.ok) {
      throw new Error("Error al guardar tipo");
    }

    input.value = "";

    // cerrar modal
    const modal = bootstrap.Modal.getInstance(
      document.getElementById("modalTipoBebida")
    );
    modal.hide();

    // recargar tipos
    await cargarTiposBebidas();

  } catch (error) {
    console.error(error);
    alert("No se pudo guardar el tipo");
  }
}


document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("guardarTipoBebida");

  if (btn) {
    btn.addEventListener("click", guardarTipoBebida);
  }


  // 3. Ejecutar la actualización (PUT) desde el modal de edición
const btnActualizar = document.getElementById("btnActualizarBebida");
if (btnActualizar) {
    btnActualizar.addEventListener("click", async () => {
        const id = document.getElementById("editBebidaId").value;
        const nombre = document.getElementById("editNombreBebida").value;
        const precio = document.getElementById("editPrecioBebida").value;
        const stock = document.getElementById("editStockBebida").value;
        const tipoNombre = document.getElementById("editSelectTipoBebida").value;

        const bebidaEditada = {
            nombre,
            precio: parseFloat(precio),
            stock: parseInt(stock),
            tipo: { nombre: tipoNombre }
        };

        try {
            const res = await fetch(`${apiInventario}/bebidas/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(bebidaEditada)
            });

            if (!res.ok) throw new Error("Error al actualizar");

            alert("Actualizado correctamente");
            location.reload();
        } catch (error) {
            console.error(error);
            alert("No se pudo actualizar");
        }
    });
 } 

 


// Dentro de DOMContentLoaded
const btnConfirmarBorrado = document.getElementById("btnConfirmarBorradoReal");
if (btnConfirmarBorrado) {
    btnConfirmarBorrado.addEventListener("click", async () => {
        const id = document.getElementById("idBebidaAEliminar").value;

        try {
            const res = await fetch(`${apiInventario}/bebidas/${id}`, {
                method: "DELETE"
            });

            if (!res.ok) throw new Error("Error al eliminar");

            // Cerrar modal de confirmación
            const modalElement = document.getElementById('modalConfirmarEliminar');
            const modal = bootstrap.Modal.getInstance(modalElement);
            if (modal) modal.hide();

            // Usamos alert sencillo como pediste
            alert("Bebida eliminada correctamente");
            
            location.reload();

        } catch (error) {
            console.error("❌ Error:", error);
            alert("No se pudo eliminar la bebida");
        }
    });
}


// 1. Abrir el modal al presionar el botón principal
    const btnAbrirModal = document.getElementById("agregarBebida");
    if (btnAbrirModal) {
        btnAbrirModal.addEventListener("click", () => {
            const modal = new bootstrap.Modal(document.getElementById('modalAgregarBebida'));
            modal.show();
        });
    }

    // 2. Ejecutar la función de guardado
    const btnGuardar = document.getElementById("btnGuardarBebidaConfirmar");
    if (btnGuardar) {
        btnGuardar.addEventListener("click", guardarNuevaBebida);
    }

});



// js/inventario.js

export async function guardarNuevaBebida() {
    // 1. Capturar elementos del DOM
    const nombre = document.getElementById("nombreBebida").value.trim();
    const precio = document.getElementById("precioBebida").value;
    const stock = document.getElementById("stockBebida").value;
    // El select donde el usuario elige el tipo (ej: "Refresco", "Cerveza")
    const selectTipo = document.getElementById("selectTipoBebida");
    const tipoNombre = selectTipo.value; 

    // 2. Validaciones básicas
    if (!nombre || !precio || !stock || !tipoNombre) {
        alert("Por favor, completa todos los campos.");
        return;
    }

    // 3. Estructura que espera tu BebidaDTO
    const nuevaBebida = {
        nombre: nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock),
        tipo: { nombre: tipoNombre } // Coincide con tu TipoBebidaDTO
    };

    try {
        const res = await fetch(`${apiInventario}/bebidas`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaBebida)
        });

        if (!res.ok) throw new Error("Error al guardar la bebida");

        const data = await res.json();
        console.log("Bebida guardada:", data);

        // 4. Limpiar formulario y cerrar modal
        document.getElementById("formNuevaBebida").reset();
        const modal = bootstrap.Modal.getInstance(document.getElementById("modalAgregarBebida"));
        modal.hide();

        // 5. Refrescar la vista
        // Aquí deberías llamar a tu función que carga la lista de nuevo
        alert("Bebida guardada con éxito");
location.reload();
    } catch (error) {
        console.error("❌ Error:", error);
        alert("No se pudo guardar la bebida");
    }
}





window.prepararEliminacion = (id) => {
    const bebida = bebidasGlobal.find(b => b.id === id);
    if (!bebida) return;

    // Llenamos los datos en el modal de confirmación
    document.getElementById("idBebidaAEliminar").value = id;
    document.getElementById("nombreBebidaAEliminar").innerText = bebida.nombre;

    // Si el modal de edición estaba abierto, lo cerramos
    const modalEdicion = bootstrap.Modal.getInstance(document.getElementById('modalEditarBebida'));
    if (modalEdicion) modalEdicion.hide();

    // Abrimos el de confirmación
    const modalEliminar = new bootstrap.Modal(document.getElementById('modalConfirmarEliminar'));
    modalEliminar.show();
 };

// Exponer funciones al objeto global para que funcionen los onclick del HTML
window.filtrarBebidasPorTipo = filtrarBebidasPorTipo;
window.prepararEdicion = prepararEdicion;
window.toggleEstado = toggleEstado;
window.prepararEliminacion = prepararEliminacion;