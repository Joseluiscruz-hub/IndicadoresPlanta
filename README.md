# 🏭 FemTech Suite Planta — Dashboard Operativo Industrial

[![Angular](https://img.shields.io/badge/Angular-21-DD0031?style=for-the-badge&logo=angular&logoColor=white)](https://angular.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Firebase](https://img.shields.io/badge/Firebase-Realtime_Database-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?style=for-the-badge&logo=googlegemini&logoColor=white)](https://ai.google.dev/)
[![D3.js](https://img.shields.io/badge/D3.js-v7-F9A03C?style=for-the-badge&logo=d3dotjs&logoColor=white)](https://d3js.org/)

**FemTech Suite Planta** es un dashboard web para concentrar, visualizar y administrar indicadores operativos de planta desde una sola interfaz. Está orientado a pantallas de monitoreo, TVs industriales, computadoras y dispositivos móviles, con un diseño responsivo y un modo de rendimiento adaptativo para equipos con recursos limitados.

El proyecto transforma múltiples métricas de operación en una vista ejecutiva con información de **seguridad, capacidad de almacén, fleteo, tiempos de estancia, tiempo perdido de montacargas, mermas, disciplina operativa, objetivos de bono y desempeño de tripulaciones**.

Además, incorpora sincronización de estado mediante **Firebase Realtime Database**, persistencia local, importación/exportación de datos en Excel y generación de análisis ejecutivos con **Google Gemini**.

---

## 🎯 Objetivo

Centralizar los principales indicadores de una operación industrial para facilitar el seguimiento diario y la toma de decisiones mediante una interfaz visual que permita responder rápidamente preguntas como:

- ¿Cuántos días lleva la operación sin accidentes?
- ¿Qué nivel de saturación tiene el almacén?
- ¿Cuál es el cumplimiento real contra el programa de fleteo?
- ¿Cómo evoluciona el tiempo de estancia contra la meta?
- ¿Dónde se concentra el tiempo perdido asociado a montacargas?
- ¿Qué tripulación presenta el mejor desempeño?
- ¿Cómo se comportan las mermas contra sus objetivos?
- ¿Cuál es el avance global de los indicadores ligados al bono de planta?
- ¿Qué información requiere atención inmediata?

---

## ✨ Funcionalidades principales

### 🦺 Seguridad industrial

Visualización de indicadores como:

- Días sin accidentes.
- Récord actual y récord anterior.
- LTI.
- MTI.
- FAC.

### 📦 Saturación de almacén

Seguimiento de capacidad utilizada para:

- Producto terminado.
- Materiales.

La interfaz calcula el porcentaje de ocupación y utiliza indicadores visuales para facilitar la identificación de niveles normales, preventivos o críticos.

### 🚚 Cumplimiento de fleteo

Comparación visual entre:

- Programa planeado.
- Resultado real.

La información se representa mediante gráficas D3.js y admite ventanas móviles de datos para mantener una visualización útil en pantallas de monitoreo.

### ⏱️ Tiempo de estancia

Seguimiento diario del tiempo real contra la meta operativa, con representación gráfica y soporte para valores expresados en minutos o formato horario.

### 🚜 Tiempo perdido de montacargas

Tabla operativa por línea con información de:

- Línea.
- Minutos perdidos.
- Tripulación.
- Indicador de desempeño.

### 💸 Merma y disciplina operativa

Visualización de:

- Merma real contra objetivo.
- Faltas injustificadas.
- Retardos.
- Indicadores visuales para desviaciones.

### 🎯 Objetivos de bono de planta

El sistema mantiene objetivos con niveles:

- Mínimo.
- Satisfactorio.
- Excelente.
- Resultado acumulado.
- Peso del indicador.

A partir de estos valores calcula un indicador global ponderado para mostrar el avance general.

### 🏆 Ranking de tripulaciones

Seguimiento de desempeño considerando variables como:

- Productividad / PDF.
- Tiempo de estancia.
- Tiempo en planta.
- Promedio de tarimas.
- Seguridad.
- Resultado acumulado.
- Ranking.

El sistema identifica automáticamente a la tripulación mejor posicionada.

---

## 🤖 Análisis con Inteligencia Artificial

El panel administrativo integra **Google Gemini 2.5 Flash** para generar un reporte ejecutivo a partir de los datos actuales de las tripulaciones.

El análisis está diseñado para identificar:

- Tripulación con mejor desempeño.
- Motivos que explican su posición.
- Tripulación con menor rendimiento.
- Observaciones críticas.
- Recomendaciones generales de mejora.

> La integración de IA debe considerarse una función asistiva. Las conclusiones operativas deben validarse con los datos fuente y el contexto real de planta.

---

## 📊 Administración de datos

FemTech Suite Planta incluye una vista administrativa desde la cual es posible:

- Actualizar manualmente indicadores de seguridad.
- Actualizar niveles de almacén.
- Modificar resultados de tripulaciones.
- Editar objetivos y resultados del bono.
- Cambiar el aviso operativo global.
- Reordenar widgets del dashboard.
- Activar o detener la simulación de datos.
- Forzar sincronización con la base remota.
- Descargar una plantilla Excel.
- Cargar información desde Excel.
- Solicitar un análisis ejecutivo con IA.

---

## 📥 Integración con Excel

El módulo administrativo utiliza **SheetJS** para generar y procesar archivos Excel.

La plantilla contempla hojas para:

- `Seguridad`
- `Almacen`
- `Fleteo`
- `TiempoEstancia`
- `Tripulacion`
- `Mermas`
- `TiempoPerdido`
- `Bono`

El sistema incluye conversión de valores horarios provenientes de Excel, incluyendo horas serializadas y cadenas `HH:MM`.

---

## ☁️ Sincronización y persistencia

La aplicación utiliza dos niveles de persistencia:

### Firebase Realtime Database

Permite mantener un estado compartido del dashboard y recibir actualizaciones remotas mediante listeners en tiempo real.

### LocalStorage

Mantiene una copia local del estado para conservar información y ofrecer una capa de respaldo cuando la sincronización remota no está disponible.

El dashboard muestra internamente si se encuentra trabajando con sincronización en nube o almacenamiento local.

---

## ⚡ Modo de rendimiento adaptativo

La aplicación detecta características del dispositivo y puede activar automáticamente un **modo ECO** cuando identifica entornos con recursos limitados, por ejemplo:

- Smart TVs.
- WebOS.
- Tizen.
- Roku.
- Navegadores antiguos.
- Dispositivos con pocos núcleos de CPU.
- Equipos con poca memoria disponible.
- Resoluciones inferiores a Full HD.

En modo ECO se reducen animaciones, sombras, gradientes, transiciones y otros efectos visuales para disminuir carga gráfica.

---

## 🧩 Arquitectura

```text
FemTechSuitePlanta/
├── src/
│   ├── app.component.ts
│   ├── app.component.html
│   ├── components/
│   │   ├── admin/
│   │   │   ├── admin.component.ts
│   │   │   └── admin.component.html
│   │   ├── charts/
│   │   │   └── d3-bar-chart.component.ts
│   │   └── dashboard/
│   │       ├── dashboard.component.ts
│   │       └── dashboard.component.html
│   └── services/
│       └── store.service.ts
├── index.html
├── index.tsx
├── angular.json
├── package.json
├── metadata.json
├── SECURITY.md
└── README.md
```

La aplicación utiliza componentes **standalone de Angular** y concentra el estado global en `StoreService` mediante **Angular Signals** y propiedades computadas.

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| Angular 21 | Framework principal |
| TypeScript 5.8 | Tipado y lógica de aplicación |
| Angular Signals | Estado reactivo |
| Firebase Realtime Database | Sincronización remota |
| LocalStorage | Persistencia local |
| Google Gemini 2.5 Flash | Análisis ejecutivo con IA |
| D3.js v7 | Visualización de datos |
| SheetJS | Lectura y generación de Excel |
| Tailwind CSS | Interfaz responsiva |
| RxJS | Programación reactiva |

D3.js, SheetJS y Tailwind se cargan actualmente desde CDN en `index.html`.

---

## 🚀 Instalación local

### Requisitos

- Node.js 20 o superior recomendado.
- npm.
- Navegador moderno.

### 1. Clonar el repositorio

```bash
git clone https://github.com/Joseluiscruz-hub/FemTechSuitePlanta.git
cd FemTechSuitePlanta
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Ejecutar en desarrollo

```bash
npm run dev
```

Angular iniciará el servidor local de desarrollo.

### 4. Compilar

```bash
npm run build
```

---

## 📜 Scripts disponibles

```bash
npm run dev
npm run build
npm run preview
npm run deploy
```

> **Nota de despliegue:** el script `deploy` actual utiliza el `base-href` `/IndicadoresPlanta/`. Si este repositorio se despliega directamente como `FemTechSuitePlanta` en GitHub Pages, debe ajustarse el `base-href` al nombre/ruta real del sitio antes del despliegue.

---

## 🔐 Seguridad

Este repositorio contiene una aplicación frontend y debe endurecerse antes de utilizarse como sistema productivo abierto.

Recomendaciones prioritarias:

1. Configurar reglas estrictas de **Firebase Realtime Database**.
2. Incorporar autenticación y autorización para la vista administrativa.
3. Evitar confiar únicamente en validaciones del frontend.
4. No almacenar secretos privados en el repositorio.
5. Ejecutar las llamadas sensibles a servicios de IA desde un backend o función segura cuando se utilicen credenciales privadas.
6. Mantener separación entre datos de demostración y datos operativos reales.
7. Revisar permisos de lectura/escritura antes de conectar una base de datos productiva.

> Las claves de configuración pública de Firebase identifican el proyecto, pero la protección real de los datos depende de las reglas de seguridad y de la autenticación configurada en Firebase.

---

## ⚠️ Estado actual

El proyecto implementa una base funcional para un dashboard industrial conectado, pero todavía debe considerarse una solución en evolución.

Actualmente incluye:

- ✅ Dashboard ejecutivo responsivo.
- ✅ Administración manual de indicadores.
- ✅ Angular Signals para estado reactivo.
- ✅ Firebase Realtime Database.
- ✅ Persistencia local.
- ✅ Sincronización manual y automática.
- ✅ Gráficas D3.js.
- ✅ Importación y generación de Excel.
- ✅ Ranking de tripulaciones.
- ✅ Cálculo ponderado de objetivos.
- ✅ Simulación de datos.
- ✅ Modo ECO para hardware limitado.
- ✅ Generación de reporte ejecutivo con Gemini.

Antes de un despliegue empresarial se recomienda agregar autenticación, control de roles, reglas de Firebase verificadas, backend seguro para funciones sensibles, auditoría de cambios y pruebas automatizadas.

---

## 🗺️ Roadmap

- [ ] Autenticación de usuarios.
- [ ] Roles Administrador / Operación / Solo lectura.
- [ ] Historial y auditoría de cambios.
- [ ] Backend seguro para integraciones de IA.
- [ ] Reglas de Firebase por rol.
- [ ] Validación avanzada de archivos Excel.
- [ ] Exportación de reportes ejecutivos.
- [ ] Filtros por fecha, turno y área.
- [ ] Integración con fuentes operativas reales.
- [ ] Alertas automáticas por desviaciones de KPI.
- [ ] Pruebas unitarias y E2E.
- [ ] Pipeline CI/CD.

---

## 👨‍💻 Autor

**José Luis Cruz Prieto**

Full-Stack Developer · Automatización · Soluciones Operativas

GitHub: [@Joseluiscruz-hub](https://github.com/Joseluiscruz-hub)

---

## 📄 Aviso

Este proyecto es una solución tecnológica para visualización y análisis operativo. Los nombres, datos y valores incluidos en configuraciones o datos de demostración deben sustituirse o anonimizarse antes de utilizar el repositorio como demostración pública, portafolio o implementación externa.
