# Dashboard Operativo Industrial

Este proyecto es una aplicación web de alto rendimiento diseñada para visualizar métricas operativas industriales en tiempo real. Utiliza un diseño de cuadrícula (Grid) optimizado para pantallas de monitoreo (TVs) y dispositivos móviles.

![Status](https://img.shields.io/badge/Status-Production%20Ready-green)
![Tech](https://img.shields.io/badge/Stack-Angular%20%2B%20Tailwind%20%2B%20D3.js-blue)

## Características Principales

1.  **Visualización de Datos en Tiempo Real:**
    *   Métricas de Seguridad (Días sin accidentes, LTI, MTI).
    *   Cumplimiento de Fleteo (Gráfica de barras comparativa Plan vs Real).
    *   Tiempos de Estancia y Pérdidas por Montacargas.
    *   Rankings de Tripulaciones con indicadores visuales.

2.  **Arquitectura Técnica:**
    *   **Angular (Zoneless):** Para máximo rendimiento y reactividad mediante Signals.
    *   **Tailwind CSS:** Diseño responsivo y sistema de rejilla (Grid Layout) de 12 columnas.
    *   **D3.js:** Gráficas vectoriales interactivas y escalables.
    *   **Google Gemini AI:** Análisis inteligente de reportes de tripulación.
    *   **SheetJS:** Carga masiva de datos mediante Excel.

3.  **Panel de Administración:**
    *   Edición manual de métricas.
    *   Carga masiva de datos (Excel).
    *   Generación de reportes con IA.
    *   Control de simulación de datos.

## Estructura del Proyecto

*   `src/components/dashboard`: Componente principal con CSS Grid Layout de 3 filas.
*   `src/components/admin`: Panel de control para inputs manuales y configuración.
*   `src/components/charts`: Gráficas D3.js reutilizables y responsivas (ResizeObserver).
*   `src/services`: Gestión del estado global mediante Angular Signals.

## Instalación y Uso

Este proyecto está diseñado para funcionar en un entorno web estándar sin configuraciones complejas de build si se usa en StackBlitz o entornos similares.

Para desarrollo local:

1.  Clonar el repositorio.
2.  Instalar dependencias (`npm install`).
3.  Ejecutar servidor de desarrollo (`npm start` o `ng serve`).

## Créditos

Diseñado siguiendo los lineamientos visuales industriales y paleta de colores corporativa ( Red).
