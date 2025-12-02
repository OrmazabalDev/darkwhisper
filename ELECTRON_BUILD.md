# 📦 Crear Ejecutable (.exe) de WhisperChat

## Pasos para generar el .exe

### 1. Instalar dependencias (ya hecho)
```powershell
npm install --save-dev electron electron-builder concurrently wait-on
```

### 2. Compilar la aplicación web
```powershell
npm run build
```

### 3. Crear el ejecutable
```powershell
npm run electron:build
```

Esto generará el instalador en la carpeta `release/`

## Probar en modo desarrollo

Antes de crear el .exe, puedes probar la app en Electron:

```powershell
npm run electron:dev
```

Esto abrirá la app en una ventana nativa mientras el servidor de desarrollo está activo.

## Ubicación del .exe

Después de ejecutar `npm run electron:build`, encontrarás:

- **Instalador**: `release/WhisperChat Setup 1.0.0.exe`
- **Portable**: Dentro de `release/win-unpacked/`

## Características del .exe

✅ Ventana nativa de Windows
✅ Icono personalizado
✅ Instalador con opciones
✅ Acceso directo en escritorio y menú inicio
✅ Funciona sin navegador visible
✅ Mismo código que la versión web

## Notas

- El .exe generado es un **instalador NSIS** que permite elegir la carpeta de instalación
- La app funcionará exactamente igual que en el navegador
- Necesita conexión a internet para conectarse a Firebase
- El tamaño aproximado será ~150-200 MB (incluye Chromium embebido)

## Distribución

El archivo `WhisperChat Setup 1.0.0.exe` es todo lo que necesitas distribuir.
Los usuarios solo tienen que ejecutarlo y seguir el asistente de instalación.
