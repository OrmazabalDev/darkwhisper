# Script para eliminar el historial de Git y empezar de cero
# ADVERTENCIA: Esto eliminara TODO el historial de commits

Write-Host "ELIMINANDO HISTORIAL DE GIT..." -ForegroundColor Red
Write-Host ""

# 1. Eliminar carpeta .git
Write-Host "1. Eliminando carpeta .git..." -ForegroundColor Yellow
Remove-Item -Recurse -Force .git

# 2. Inicializar nuevo repositorio
Write-Host "2. Inicializando nuevo repositorio..." -ForegroundColor Yellow
git init

# 3. Agregar todos los archivos
Write-Host "3. Agregando archivos..." -ForegroundColor Yellow
git add .

# 4. Crear commit inicial
Write-Host "4. Creando commit inicial limpio..." -ForegroundColor Yellow
git commit -m "Initial commit - Secure version with environment variables"

# 5. Agregar remote
Write-Host "5. Agregando remote..." -ForegroundColor Yellow
git remote add origin https://github.com/OrmazabalDev/whisperchat.git

Write-Host ""
Write-Host "Historial limpio creado!" -ForegroundColor Green
Write-Host ""
Write-Host "IMPORTANTE: Ahora ejecuta:" -ForegroundColor Cyan
Write-Host "git push -f origin main" -ForegroundColor White
Write-Host ""
Write-Host "Esto SOBREESCRIBIRA el repositorio remoto con el nuevo historial limpio" -ForegroundColor Yellow
