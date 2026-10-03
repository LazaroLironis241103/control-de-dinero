"use strict";
let grafico = null; // ✅ Declarado antes de llamar a renderizarGraficoMensual
const toggleButton = document.getElementById("toggleDarkMode");
const body = document.body;
if (localStorage.getItem("modoOscuro") === "true") {
    body.classList.add("dark-mode");
}
toggleButton === null || toggleButton === void 0 ? void 0 : toggleButton.addEventListener("click", () => {
    body.classList.toggle("dark-mode");
    localStorage.setItem("modoOscuro", body.classList.contains("dark-mode").toString());
});
function generarID() {
    return Date.now() + Math.floor(Math.random() * 1000);
}
// Elementos del DOM
const ingresosInput = document.getElementById("ingresos");
const gastosInput = document.getElementById("gastos");
const ahorrosInput = document.getElementById("ahorros");
const descripcionInput = document.getElementById("descripcion");
const totalTexto = document.getElementById("total");
const ahorrosTexto = document.getElementById("ahorrosInfo");
const listaHistorial = document.getElementById("listaHistorial");
const btnCalcular = document.getElementById("calcular");
const btnReiniciar = document.getElementById("reiniciar");
// Estado inicial
let historial = JSON.parse(localStorage.getItem("historial") || "[]");
let total = parseFloat(localStorage.getItem("total") || "0");
let ahorros = parseFloat(localStorage.getItem("ahorros") || "0");
// Mostrar valores al cargar
actualizarVista();
renderizarHistorial();
renderizarGraficoMensual();
btnCalcular.addEventListener("click", () => {
    const ingresos = parseFloat(ingresosInput.value) || 0;
    const gastos = parseFloat(gastosInput.value) || 0;
    const nuevosAhorros = parseFloat(ahorrosInput.value) || 0;
    const descripcion = descripcionInput.value.trim();
    const fecha = new Date().toLocaleDateString("es-AR");
    if (ingresos < 0 || gastos < 0 || nuevosAhorros < 0) {
        alert("No se permiten valores negativos.");
        return;
    }
    if (!descripcion) {
        alert("Por favor, escribí una descripción del movimiento.");
        return;
    }
    if (ingresos === 0 && gastos === 0) {
        alert("Debes ingresar un valor mayor a cero en Ingresos o Gastos.");
        return;
    }
    if (ingresos > 0) {
        total += ingresos;
        historial.push({
            id: generarID(),
            tipo: "ingreso",
            monto: ingresos,
            descripcion,
            fecha
        });
    }
    if (gastos > 0) {
        total -= gastos;
        historial.push({
            id: generarID(),
            tipo: "gasto",
            monto: gastos,
            descripcion,
            fecha
        });
    }
    ahorros = nuevosAhorros;
    // Guardar datos en localStorage
    localStorage.setItem("total", total.toString());
    localStorage.setItem("ahorros", ahorros.toString());
    localStorage.setItem("historial", JSON.stringify(historial));
    // Limpiar inputs
    ingresosInput.value = "";
    gastosInput.value = "";
    ahorrosInput.value = "";
    descripcionInput.value = "";
    actualizarVista();
    renderizarHistorial();
    renderizarGraficoMensual();
    mostrarToast("Movimiento agregado");
});
btnReiniciar.addEventListener("click", () => {
    total = 0;
    ahorros = 0;
    historial = [];
    localStorage.clear();
    ingresosInput.value = "";
    gastosInput.value = "";
    ahorrosInput.value = "";
    descripcionInput.value = "";
    actualizarVista();
    renderizarHistorial();
    renderizarGraficoMensual();
    mostrarToast("Datos reiniciados");
});
function actualizarVista() {
    totalTexto.textContent = `Total disponible: $${total.toFixed(2)}`;
    ahorrosTexto.textContent = `Ahorros del mes: $${ahorros.toFixed(2)}`;
}
function renderizarHistorial() {
    listaHistorial.innerHTML = "";
    historial.forEach((mov) => {
        const li = document.createElement("li");
        const contenedorTexto = document.createElement("div");
        contenedorTexto.classList.add("texto-movimiento");
        const montoSpan = document.createElement("span");
        montoSpan.textContent = `$${mov.monto.toFixed(2)}`;
        montoSpan.classList.add("monto", mov.tipo === "ingreso" ? "positivo" : "negativo");
        const signo = mov.tipo === "ingreso" ? "+" : "-";
        const tipoCapitalizado = mov.tipo === "ingreso" ? "Ingreso" : "Gasto";
        contenedorTexto.append(`${signo} ${tipoCapitalizado}: `);
        contenedorTexto.appendChild(montoSpan);
        contenedorTexto.append(` - ${mov.descripcion} (${mov.fecha})`);
        const btnEliminar = document.createElement("button");
        btnEliminar.textContent = "Eliminar";
        btnEliminar.addEventListener("click", () => {
            eliminarMovimiento(mov.id);
        });
        li.appendChild(contenedorTexto);
        li.appendChild(btnEliminar);
        listaHistorial.appendChild(li);
    });
}
function eliminarMovimiento(id) {
    const index = historial.findIndex(mov => mov.id === id);
    if (index > -1) {
        const mov = historial[index];
        if (mov.tipo === "ingreso") {
            total -= mov.monto;
        }
        else if (mov.tipo === "gasto") {
            total += mov.monto;
        }
        historial.splice(index, 1);
        localStorage.setItem("historial", JSON.stringify(historial));
        localStorage.setItem("total", total.toString());
        renderizarHistorial();
        actualizarVista();
        renderizarGraficoMensual();
        mostrarToast("Movimiento eliminado");
    }
}
function obtenerTotalPorMes() {
    const totales = {};
    historial.forEach((mov) => {
        const fecha = new Date(mov.fecha);
        if (isNaN(fecha.getTime()))
            return;
        const claveMes = `${fecha.getFullYear()}-${fecha.getMonth() + 1}`;
        if (!totales[claveMes])
            totales[claveMes] = 0;
        totales[claveMes] += mov.tipo === "ingreso" ? mov.monto : -mov.monto;
    });
    return totales;
}
function renderizarGraficoMensual() {
    const datosPorMes = obtenerTotalPorMes();
    const labels = Object.keys(datosPorMes).sort();
    const datos = labels.map(mes => datosPorMes[mes]);
    const ctx = document.getElementById("graficoMensual");
    if (grafico) {
        grafico.destroy();
    }
    grafico = new Chart(ctx, {
        type: "bar",
        data: {
            labels,
            datasets: [{
                    label: "Total mensual",
                    data: datos,
                    backgroundColor: "rgba(75, 192, 192, 0.6)"
                }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}
function mostrarToast(mensaje) {
    const toast = document.getElementById("toast");
    if (!toast)
        return;
    toast.textContent = mensaje;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}
