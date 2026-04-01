# Guía de Despliegue para Servidor Web - Taller de Motos

¡Felicidades por dar el paso de llevar tu sistema a la nube! 

Esta carpeta (`Taller_Web`) se ha creado con tu código fuente exacto, pero **preparado para ser subido a un servidor de internet (VPS, Heroku, Render, AWS, etc.)**. Esto te permitirá tener tu base de datos centralizada y acceder a ella desde tu teléfono, desde casa o el taller al mismo tiempo.

## ¿Cómo funciona el nuevo modelo?

Cuando contrates un servidor, tendrás que pasarle o configurar dos piezas:
1. **El Motor "Backend" (Python)**: Será el cerebro central que estará encendido 24/7 en internet alojando tu base de datos (`workshop.db`) y tus fotos (`imagenes/`).
2. **La Interfaz "Frontend" (Web)**: Será la página web a la que la gente (tú o tus futuros clientes empreados) entraréis mediante un dominio, por ejemplo: `app.mitaller.com`.

### ¿Y los ordenadores y portátiles locales?
Si quieres que una persona se descargue "tu programa" (la versión Portable que hicimos antes) y lo ejecute en su ordenador con un doble clic **PERO los datos se guarden en tu servidor de internet**, es muy fácil: 
La versión de escritorio (Electron) se conectará a tu servidor web automáticamente a través de la variable `VITE_API_URL`. Todo funcionará en su pantalla como un programa nativo de escritorio, pero la información viajará de forma invisible hasta tu servidor.

---

## 👨‍💻 INSTRUCCIONES TÉCNICAS (Para ti o para el informático que te monte el servidor)

### 1. Despliegue del Backend (API)
- **Lenguaje:** Python 3.9 o superior.
- **Framework:** FastAPI.
- **Comandos de instalación:** 
  ```bash
  cd backend
  python -m venv venv
  source venv/bin/activate
  pip install -r requirements.txt
  ```
- **Comando de ejecución (Producción con Uvicorn/Gunicorn):**
  ```bash
  uvicorn main:app --host 0.0.0.0 --port 8000
  ```
- *Aviso:* Asegúrate de que las carpetas `/imagenes`, `/documentos` y `/logos` tengan permisos de escritura (chmod 777) en el servidor Linux, o el programa no podrá guardar los recibos.
- *Base de datos:* Por defecto utiliza SQLite (`workshop.db`), lo cual es seguro y portable. Si planeas que miles de usuarios usen el taller simultáneamente, escalar a PostgreSQL es muy sencillo, ya que el sistema usa SQLAlchemy (solo basta cambiar la cadena de conexión en `database.py`).

### 2. Despliegue del Frontend (Interfaz Web)
- **Lenguaje:** JavaScript / React / Vite.
- En el servidor donde subas el Frontend, debes indicarle dónde está escuchando el Backend.
- Crea un archivo `.env` dentro de la carpeta `frontend/` y pon la dirección pública de tu API:
  ```env
  VITE_API_URL=https://api.dominiodetutaller.com
  ```
- **Comandos de construcción:**
  ```bash
  npm install
  npm run build
  ```
- **Despliegue final:** El comando anterior generará una carpeta `dist`. Solo tienes que decirle a tu servidor Nginx, Apache, o Vercel que lea los HTML/JS desde esa carpeta `dist`.

---

## Próximos Pasos (Vender el Sistema)
Si quieres empaquetar tu programa para venderlo como "Servicio en la Nube" a talleres de terceros:
1. Contrata un servidor VPS (valen entre $5 y $10 al mes en empresas como DigitalOcean, Linode, o Hetzner).
2. Sube esta carpeta al servidor.
3. Para cada taller que te contrate, puedes duplicar esta estructura en el servidor y asignarles un subdominio distinto (`taller1.mitaller.com`, `taller2.mitaller.com`). Cada uno tendrá de forma privada su propia `workshop.db` y sus propias contraseñas!
