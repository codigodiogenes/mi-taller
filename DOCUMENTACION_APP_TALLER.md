# 🔧 Guía Fácil: Cómo Funciona tu App de Taller

¡Hola! Al igual que con la app de cajas, aquí tienes una guía sencilla para entender tu sistema de gestión de taller sin necesidad de ser un experto en programación.

---

## 📂 Mapa de la Aplicación

Tu taller digital está dividido así:
-   **`📂 frontend`**: Todo lo que ves y tocas. Usa **React** y **Tailwind CSS** (un sistema de diseño moderno).
-   **`📂 backend`**: El "cerebro" que procesa las reparaciones y clientes. Usa **Python (FastAPI)**.
-   **`📂 taller_data`**: El almacén real. Aquí es donde se guarda la base de datos (`workshop.db`) y todas las fotos de las motos y documentos. **¡Es la carpeta más importante para tus copias de seguridad!**

---

## 🎨 Guía de Estilos (Diseño y Colores)

A diferencia de la otra app, esta usa **Tailwind CSS**. Esto significa que los colores no suelen estar en un solo archivo, sino escritos directamente en las piezas del código.

### 1. ¿Cómo cambio un color?
Busca palabras como `bg-blue-600` (fondo azul) o `text-red-500` (texto rojo) en los archivos `.jsx`. 
-   Si quieres cambiar un botón azul a verde, cambia `bg-blue-600` por `bg-green-600`.

### 2. Estilos Globales
**Archivo**: `frontend/src/index.css`
-   Aquí se define el color de fondo básico de la app (normalmente un gris muy suave `bg-slate-50`).

---

## 📍 Localizador de Pantallas y Botones

Para hacer cambios rápidos, abre los archivos en `frontend/src/pages/` y usa **Ctrl + F**:

### 1. Inicio (Dashboard)
**Archivo**: `Dashboard.jsx`
-   **Tarjetas de Resumen (Clientes, Motos...)**: Busca `StatCard` (Línea ~14).
-   **Tabla de Últimos Movimientos**: Busca `Últimos Movimientos` (Línea ~174).

### 2. Gestión de Reparaciones
**Archivo**: `Repairs.jsx`
-   **Botón Nueva Reparación**: Busca `NUEVA REPARACIÓN` (Línea ~220).
-   **Filtros de Estado (Pendiente, Terminado...)**: Busca `statusFilters` (Línea ~190).

### 3. Ficha de Moto / Trámites
**Archivo**: `MotorcycleDetails.jsx`
-   Aquí es donde se editan los detalles técnicos de cada vehículo. Es el archivo más grande.
-   **Botón Editar Moto**: Busca `✏️` o `Editar`.

---

## 💾 ¿Dónde están mis datos y copias? (¡IMPORTANTE!)

Para que nunca pierdas nada, debes saber dónde se guarda la información real:

### 1. La Base de Datos (Tus datos)
-   **Archivo**: Todo se guarda en un único archivo llamado **`workshop.db`**. 
-   **Ubicación**: Está dentro de la carpeta **`taller_data`**. 
-   *Nota*: Este archivo contiene todos tus clientes, reparaciones, motos y stock.

### 2. Las Copias de Seguridad
-   **Carpeta**: **`taller_data/copias_de_seguridad/`**.
-   **Archivo**: Verás un archivo llamado **`COPIA_SEGURIDAD_TALLER.zip`**.
-   **Cómo se crean**: La app tiene un botón en Ajustes para generar este archivo. Es un "paquete" que contiene la base de datos, las fotos y los documentos.
-   *Consejo*: Te recomiendo copiar ese archivo `.zip` a un pendrive o a la nube (Google Drive/Dropbox) de vez en cuando.

---

-   **Archivo único**: Todo se guarda en un solo archivo llamado `workshop.db`. No hay bases de datos separadas por usuario aquí, es un sistema centralizado para el taller.
-   **Acceso**: El sistema usa **Usuario y Contraseña** manuales. No hay conexión con Gmail en esta app por ahora.
-   **Fotos**: Las fotos de las reparaciones se guardan en `taller_data/imagenes`.

---

## 🔐 Acceso de Usuarios

Si quieres añadir o borrar quién puede entrar a la app:
1.  Ve a **Ajustes** (Settings) dentro de la app.
2.  Busca la sección de **Gestión de Usuarios**.
3.  En el código, esto se controla en `UserManagementModal.jsx` (Línea ~1).

---

## 🛠️ Cómo aplicar tus cambios
Igual que siempre, para que el servidor "se entere" de que has cambiado algo en el diseño o el texto:

1.  Abre la terminal en la carpeta `C:\servidor_taller`.
2.  Escribe: `docker-compose up --build -d`
3.  ¡Listo! Refresca tu navegador.
