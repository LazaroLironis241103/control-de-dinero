# 💸 Control de Dinero

App web de control de gastos personales, hecha con **Angular** y **Firebase**. Permite iniciar sesión con Google, registrar ingresos y gastos, y ver tu balance y un resumen con gráfico, en modo claro u oscuro.

🔗 **Demo en vivo:** [control-dinero-69857.web.app](https://control-dinero-69857.web.app/)

## ✨ Funcionalidades

- 🔐 Inicio de sesión con Google (Firebase Authentication)
- 💰 Registro de ingresos y gastos con descripción
- 📊 Balance disponible y resumen general con gráfico de dona (Chart.js)
- 🧾 Historial con filtros por tipo (todos, ingresos o gastos) y por mes
- 🗑️ Eliminación de movimientos individuales y opción de reiniciar datos
- ☁️ Datos guardados en la nube con Firestore, separados por usuario
- 🌗 Modo claro y oscuro

## 🛠️ Tecnologías

![Angular](https://img.shields.io/badge/Angular-DD0031?style=flat-square&logo=angular&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)

## 🔒 Seguridad

Las reglas de Firestore (`firestore.rules`) permiten que cada usuario autenticado lea y escriba únicamente sus propios datos.

## 🚀 Cómo correrlo localmente

1. Cloná el repositorio:
```bash
   git clone https://github.com/LazaroLironis241103/control-de-dinero.git
   cd control-de-dinero
```
2. Instalá las dependencias:
```bash
   npm install
```
3. Creá tu propio proyecto en [Firebase](https://console.firebase.google.com/), activá Authentication (Google) y Firestore, y completá tus datos en `src/app/firebase.config.ts`.
4. Iniciá el servidor de desarrollo:
```bash
   npm start
```
5. Abrí `http://localhost:4200` en el navegador.

## 👤 Autor

**Lázaro Lironis** · [GitHub](https://github.com/LazaroLironis241103)
