# Guía para limpiar credenciales del historial de Git

## Opción 1: Reiniciar Historial Completo (RECOMENDADO - Más Simple)

### Pasos:

1. **Ejecuta el script PowerShell:**
```powershell
.\reset-git-history.ps1
```

2. **Push forzado al repositorio:**
```bash
git push -f origin main
```

3. **¡Listo!** El historial quedará limpio desde cero.

---

## Opción 2: BFG Repo-Cleaner (Mantiene historial de commits)

### Instalación:

1. **Descarga BFG:**
   - https://rtyley.github.io/bfg-repo-cleaner/
   - O con Chocolatey: `choco install bfg-repo-cleaner`

2. **Crea archivo con credenciales a eliminar:**

Crea `credentials.txt` con las credenciales que quieres eliminar:
```
AIzaSyBBE3bTw9LFXNVIvZQP2VscigLIcQ-BGeQ
whisper-5be04.firebaseapp.com
whisper-5be04-default-rtdb.firebaseio.com
804228820534
1:804228820534:web:b5820fe936f0e563d0b297
G-0BJSYJ62ZP
```

3. **Ejecuta BFG:**
```bash
# Clona una copia mirror
git clone --mirror https://github.com/OrmazabalDev/whisperchat.git

# Elimina las credenciales del historial
bfg --replace-text credentials.txt whisperchat.git

# Limpia y optimiza
cd whisperchat.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push forzado
git push --force
```

---

## Opción 3: git filter-branch (Manual - Más Control)

```bash
# Eliminar archivo específico del historial
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch src/firebase.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Forzar push
git push origin --force --all
```

---

## ⚠️ DESPUÉS de limpiar el historial:

### 1. Invalida las credenciales antiguas en Firebase:

Ve a Firebase Console → Project Settings → Regenera las API Keys

### 2. Actualiza tus credenciales locales:

Actualiza `.env` con las nuevas credenciales

### 3. Actualiza GitHub Secrets:

Settings → Secrets → Actualiza todos los valores

---

## 🎯 Recomendación:

**Usa la Opción 1** (script PowerShell) porque:
- ✅ Es la más simple y segura
- ✅ No deja rastros de las credenciales
- ✅ Crea un historial limpio desde cero
- ✅ Evita errores técnicos

Solo perderás el historial de commits, pero tu código actual estará intacto y seguro.

---

## 📝 Después del push forzado:

Si otras personas han clonado el repo, deben ejecutar:
```bash
git fetch origin
git reset --hard origin/main
```

---

## 🔒 Rotación de Credenciales (IMPORTANTE):

Aunque limpies el historial, las credenciales ya fueron expuestas. **Debes rotarlas**:

1. Firebase Console → Project Settings
2. Regenera API Key
3. Crea nueva Web App
4. Actualiza todas las credenciales en `.env` y GitHub Secrets

Esto asegura que las credenciales antiguas (aunque borradas del historial) ya no funcionen.
