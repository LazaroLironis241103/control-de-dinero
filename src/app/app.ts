import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, signal, computed, NgZone, ChangeDetectorRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { auth, provider, db } from './firebase.config.js';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy } from 'firebase/firestore';

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('graficoCanvas') graficoCanvas!: ElementRef<HTMLCanvasElement>;

  usuario = signal<User | null>(null);
  historial = signal<any[]>([]);
  filtroTipo = signal<string>('todos');
  filtroMes = signal<string>('');
  
  isDarkMode = true;
  isLoading = signal(true);
  toastMessage = '';
  ingresos: number | null = null;
  gastos: number | null = null;
  descripcion = '';

  tiposFiltro = [
    { label: 'Todos', valor: 'todos' },
    { label: 'Ingresos', valor: 'ingreso' },
    { label: 'Gastos', valor: 'gasto' }
  ];

  totalIngresos = computed(() => this.historial().filter(m => m.tipo === 'ingreso').reduce((acc, m) => acc + m.monto, 0));
  totalGastos = computed(() => this.historial().filter(m => m.tipo === 'gasto').reduce((acc, m) => acc + m.monto, 0));
  totalBalance = computed(() => this.totalIngresos() - this.totalGastos());
  
  mesesDisponibles = computed(() => {
    const meses = new Set(this.historial().map(m => m.fechaISO));
    return Array.from(meses).map(m => ({ label: m, valor: m }));
  });

  historialFiltrado = computed(() => this.historial().filter(mov => {
    return (this.filtroTipo() === 'todos' || mov.tipo === this.filtroTipo()) && 
           (!this.filtroMes() || mov.fechaISO === this.filtroMes());
  }));

  private chart: Chart | null = null;
  private unsubscribeSnapshot: (() => void) | null = null;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) {
    effect(() => {
      this.historial();
      setTimeout(() => this.actualizarGrafico(), 100);
    });
  }

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('modoOscuro') !== 'false';

    onAuthStateChanged(auth, (user) => {
      this.ngZone.run(() => {
        this.usuario.set(user);

        if (user) {
          this.escucharDatos(user.uid);
        } else {
          this.historial.set([]);
          this.chart?.destroy();
          this.chart = null;
        }

        this.isLoading.set(false);
      });
    });
  }

  ngAfterViewInit() {
    this.actualizarGrafico();
  }

  ngOnDestroy() {
    this.chart?.destroy();
    this.unsubscribeSnapshot?.();
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
  }

  cargando() {
    return this.isLoading();
  }

  total() {
    return this.totalBalance();
  }

  hayDatosParaGrafico() {
    return this.historial().length > 0;
  }

  toggleDarkMode() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('modoOscuro', this.isDarkMode.toString());
  }

  async loginGoogle() {
    this.isLoading.set(true);
    try {
      await signInWithPopup(auth, provider);
      this.showToast('Sesión iniciada.');
    } catch (error) {
      console.error(error);
      this.showToast('Error al iniciar sesión con Google.');
    } finally {
      this.isLoading.set(false);
    }
  }

  async logout() {
    try {
      await signOut(auth);
      this.usuario.set(null);
      this.historial.set([]);
      this.chart?.destroy();
      this.chart = null;
      this.showToast('Sesión cerrada.');
    } catch (error) {
      console.error(error);
      this.showToast('Error al cerrar sesión.');
    }
  }

  private showToast(message: string) {
    this.toastMessage = message;
    if (this.toastTimeout) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.toastMessage = '';
      this.toastTimeout = null;
      this.cdr.markForCheck();
    }, 3500);
  }

  async reiniciar() {
    const user = this.usuario();
    if (!user) {
      this.showToast('Inicia sesión para reiniciar datos.');
      return;
    }

    if (!confirm('¿Borrar todos los movimientos?')) {
      return;
    }

    const movimientos = this.historial();
    try {
      await Promise.all(movimientos.map((mov) => deleteDoc(doc(db, 'usuarios', user.uid, 'movimientos', mov.id))));
      this.showToast('Movimientos eliminados.');
    } catch (error) {
      console.error(error);
      this.showToast('Error al reiniciar movimientos.');
    }
  }

  async eliminarMovimiento(id: string) {
    const user = this.usuario();
    if (!user) {
      this.showToast('Inicia sesión para eliminar movimientos.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'usuarios', user.uid, 'movimientos', id));
      this.showToast('Movimiento eliminado.');
    } catch (error) {
      console.error(error);
      this.showToast('Error al eliminar movimiento.');
    }
  }
  
  async calcular() {
    const user = this.usuario();
    if (!user) {
      this.showToast('Inicia sesión para registrar un movimiento.');
      return;
    }

    const ingreso = this.ingresos ?? 0;
    const gasto = this.gastos ?? 0;
    const descripcion = this.descripcion.trim();

    if (!ingreso && !gasto) {
      this.showToast('Ingresa un monto de ingreso o gasto.');
      return;
    }

    if (ingreso > 0 && gasto > 0) {
      this.showToast('Usa solo ingreso o gasto, no ambos.');
      return;
    }

    const tipo = ingreso > 0 ? 'ingreso' : 'gasto';
    const monto = ingreso > 0 ? ingreso : gasto;

    if (!monto || monto <= 0) {
      this.showToast('El monto debe ser mayor que cero.');
      return;
    }

    try {
      await addDoc(collection(db, 'usuarios', user.uid, 'movimientos'), {
        descripcion: descripcion || 'Movimiento sin descripción',
        monto,
        tipo,
        fecha: new Date().toLocaleDateString('es-AR'),
        fechaISO: new Date().toISOString().slice(0, 7),
        timestamp: new Date()
      });

      this.ingresos = null;
      this.gastos = null;
      this.descripcion = '';
      this.showToast('Movimiento registrado.');
    } catch (error) {
      console.error(error);
      this.showToast('Error al guardar movimiento.');
    }
  }

  actualizarGrafico() {
    const ctx = this.graficoCanvas?.nativeElement?.getContext('2d');
    if (!ctx) {
      return;
    }

    const datos = [this.totalIngresos(), this.totalGastos()];

    if (this.chart) {
      this.chart.data.datasets = [
        {
          data: datos,
          backgroundColor: ['#4caf50', '#f44336'],
          hoverBackgroundColor: ['#66bb6a', '#e57373']
        }
      ];
      this.chart.update();
      return;
    }

    this.chart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Ingresos', 'Gastos'],
        datasets: [
          {
            data: datos,
            backgroundColor: ['#4caf50', '#f44336'],
            hoverBackgroundColor: ['#66bb6a', '#e57373'],
            borderWidth: 0
          }
        ]
      },
      options: {
        plugins: {
          legend: {
            display: false
          }
        },
        cutout: '70%'
      }
    });
  }

  escucharDatos(uid: string) {
    const q = query(collection(db, 'usuarios', uid, 'movimientos'), orderBy('timestamp', 'desc'));
    this.unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
      this.ngZone.run(() => {
        this.historial.set(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
      });
    });
  }
}