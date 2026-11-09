# TalentoLink · Prototipo funcional v1.0.0

Prototipo funcional del módulo empresarial de TalentoLink: publicación de vacantes, recepción de hojas de vida en PDF con autorización de tratamiento de datos (Ley 1581 de 2012), bandeja de candidatos con filtros, estados del proceso, entrevistas, notificaciones por correo (simuladas) y reportes.

## Contenido del paquete

| Archivo | Descripción |
|---|---|
| `index.html` | El prototipo completo (HTML, CSS y JavaScript, sin dependencias externas). |
| `hv_prueba.pdf` | Hoja de vida de ejemplo para probar la postulación. |
| `pruebas/e2e.js` | Pruebas funcionales automatizadas (Playwright). |
| `pruebas/resultados.json` | Resultado de la última ejecución de las pruebas. |

## Requisitos

- Un navegador actualizado: Google Chrome, Microsoft Edge o Mozilla Firefox.
- No requiere instalar bases de datos ni servidores: la información se guarda en el navegador (IndexedDB).

## Instalación y ejecución

### Opción 1 · Abrir directamente (la más sencilla)

1. Descomprima el archivo `TalentoLink_prototipo.zip`.
2. Haga doble clic en `index.html`. Se abre en el navegador predeterminado.

### Opción 2 · Servidor local (recomendada para pruebas)

Con Python 3 instalado, abra una terminal en la carpeta descomprimida y ejecute:

```
python -m http.server 8080
```

Luego abra `http://localhost:8080` en el navegador. Para detener el servidor presione `Ctrl + C`.

### Opción 3 · Publicar en GitHub Pages (enlace público gratuito)

1. Cree un repositorio público en GitHub (por ejemplo, `talentolink`).
2. Suba el archivo `index.html` a la raíz del repositorio.
3. Vaya a **Settings > Pages**, en **Source** elija la rama `main` y la carpeta `/ (root)` y guarde.
4. Después de uno o dos minutos el prototipo queda disponible en `https://<usuario>.github.io/talentolink/`.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Administrador | admin@andina.co | Demo2026* |
| Reclutador | reclutador@andina.co | Demo2026* |

También puede registrar una empresa nueva desde **Registrar empresa**.

## Recorrido sugerido

1. **Portal público > Ofertas de empleo:** abra una vacante y postúlese con `hv_prueba.pdf`. Guarde el radicado.
2. **Iniciar sesión** como administrador y revise el **Panel**.
3. **Candidatos:** aplique filtros por experiencia, estudios, ciudad y aspiración; abra un candidato, cambie su estado a *Entrevista* y agende la fecha.
4. **Notificaciones:** verifique el correo enviado al aspirante.
5. **Consultar mi proceso** (portal público): consulte con el radicado y el documento.
6. **Reportes:** revise postulaciones por vacante y tiempos promedio.
7. **Empresa y datos > Cargar 1.000 hojas de vida de prueba:** compruebe el tiempo de respuesta de los filtros.

## Notas

- Los datos se conservan en el navegador donde se usa el prototipo. Para empezar de cero use **Empresa y datos > Restablecer datos de demostración**.
- El envío de correos es simulado: los mensajes se registran en **Notificaciones**.
- Ejecutar las pruebas automatizadas (opcional): `npm i -D playwright`, `npx playwright install chromium`, iniciar el servidor de la opción 2 en el puerto 8765 y ejecutar `node pruebas/e2e.js`.
