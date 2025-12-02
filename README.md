# 🕵️ DarkWhisper - Anonymous Encrypted Chat

<div align="center">

![License](https://img.shields.io/badge/license-Proprietary-red)
![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Last Update](https://img.shields.io/badge/last%20update-02%2F12%2F2025-green)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-10.7.1-FFCA28?logo=firebase)
![Electron](https://img.shields.io/badge/Electron-39.2.4-47848F?logo=electron)

**Una aplicación de chat anónimo con cifrado de extremo a extremo y auto-eliminación de mensajes**

[English](#english-version) | [Español](#versión-en-español)

</div>

---

## 🇪🇸 Versión en Español

### 📋 Descripción

**DarkWhisper** es una aplicación de chat en tiempo real que prioriza la privacidad y el anonimato. Diseñada con fines educativos y de demostración de portafolio, implementa cifrado de extremo a extremo (E2EE) y auto-eliminación automática de mensajes cada 60 segundos.

### ✨ Características Principales

- 🔐 **Cifrado de Extremo a Extremo**: Todos los mensajes se cifran con AES-GCM de 256 bits
- ⏱️ **Auto-eliminación**: Los mensajes se eliminan automáticamente después de 60 segundos
- 👤 **100% Anónimo**: Sin registro, sin historial, sin datos personales
- 🌐 **Multi-plataforma**: Disponible como aplicación web y de escritorio (Electron)
- 📎 **Envío de archivos**: Soporte para imágenes, videos, audio y documentos
- 👥 **Presencia en tiempo real**: Visualiza cuántos usuarios están conectados
- 💬 **Indicador de escritura**: Notificación cuando otros usuarios están escribiendo
- 🎨 **UI Moderna**: Interfaz oscura diseñada con Tailwind CSS
- ⚡ **Tiempo Real**: Sincronización instantánea con Firebase Realtime Database

### 🛠️ Tecnologías Utilizadas

#### Frontend
- **React 18.2** - Biblioteca de interfaz de usuario
- **TypeScript 5.2** - Tipado estático y mejor experiencia de desarrollo
- **Vite 5.0** - Build tool de nueva generación
- **Tailwind CSS 4.1** - Framework de CSS utility-first
- **Lucide React** - Iconos modernos y personalizables

#### Backend & Servicios
- **Firebase 10.7**
  - Authentication (Anónima)
  - Realtime Database (Mensajes y presencia)
  - Storage (Archivos multimedia)
- **Web Crypto API** - Cifrado AES-GCM del lado del cliente

#### Desktop
- **Electron 39.2** - Aplicación de escritorio multiplataforma
- **Electron Builder** - Empaquetado y distribución

### 🔒 Seguridad y Privacidad

#### Cifrado
- **Algoritmo**: AES-GCM de 256 bits
- **Derivación de clave**: PBKDF2 con 310,000 iteraciones
- **Vectores de inicialización**: Únicos para cada mensaje
- **Ubicación**: Todo el cifrado ocurre en el cliente

#### Privacidad
- ✅ Sin registro de usuarios
- ✅ Sin almacenamiento de historial
- ✅ Sin recopilación de datos personales
- ✅ Auto-eliminación de mensajes (60s)
- ✅ Auto-eliminación de archivos (5 minutos)
- ✅ Sin logs del servidor
- ✅ Sin seguimiento de usuarios

### 📦 Instalación y Uso

#### Requisitos Previos
- Node.js 18+ y npm
- Cuenta de Firebase (para configuración)
- Git

#### Configuración

1. **Clonar el repositorio**
```bash
git clone https://github.com/OrmazabalDev/whisperchat.git
cd whisperchat
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar Firebase**

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_DATABASE_URL=tu_database_url
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id
```

4. **Configurar reglas de Firebase**

Aplica las reglas de seguridad desde `database.rules.json` y `firebase.json` a tu proyecto Firebase.

#### Scripts Disponibles

```bash
# Desarrollo web
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Desarrollo Electron
npm run electron:dev

# Build Electron
npm run electron:build

# Deploy a GitHub Pages
npm run deploy
```

### 🏗️ Estructura del Proyecto

```
whisperchat/
├── src/
│   ├── components/
│   │   ├── chat/          # Componentes de mensajería
│   │   ├── layout/        # Componentes de diseño
│   │   └── ui/            # Componentes de UI reutilizables
│   ├── contexts/          # React Context (Auth, Chat, Crypto)
│   ├── hooks/             # Custom React Hooks
│   ├── services/          # Servicios (Auth, DB, Crypto, Storage)
│   ├── types/             # Definiciones de TypeScript
│   └── utils/             # Utilidades y helpers
├── electron.cjs           # Configuración de Electron
├── firebase.json          # Configuración de Firebase
├── database.rules.json    # Reglas de seguridad de Firebase
└── vite.config.ts         # Configuración de Vite
```

### 📱 Funcionalidades Detalladas

#### Autenticación
- Login anónimo automático con Firebase Auth
- Generación de apodos aleatorios
- Gestión de sesión persistente

#### Mensajería
- Envío y recepción en tiempo real
- Cifrado E2EE con clave compartida
- Auto-eliminación después de 60 segundos
- Validación de longitud de mensaje (máx. 1000 caracteres)
- Soporte para múltiples líneas

#### Multimedia
- Subida de imágenes (JPEG, PNG, GIF, WebP)
- Subida de videos (MP4, WebM, MOV, AVI)
- Subida de audio (MP3, WAV, OGG, M4A)
- Subida de documentos (PDF, DOC, DOCX, TXT, etc.)
- Límite de tamaño: 10 MB
- Auto-eliminación después de 5 minutos

#### Presencia
- Contador de usuarios activos en tiempo real
- Sistema de heartbeat cada 30 segundos
- Auto-limpieza de usuarios inactivos

#### Estado de Escritura
- Indicador visual cuando otros usuarios están escribiendo
- Timeout automático después de 3 segundos

### ⚖️ Licencia y Uso Legal

**Licencia**: Propietaria - Proyecto de Portafolio

© 2025 DarkWhisper - Desarrollado por **OrmazabalDev**

Este software está protegido por un End User License Agreement (EULA) personalizado. Ver `LICENSE.txt` para términos completos.

#### Propósito
Este proyecto es con fines de:
- ✅ **Portafolio** - Demostración de habilidades técnicas
- ✅ **Educación** - Aprendizaje de cifrado y comunicación en tiempo real
- ✅ **Pruebas** - Experimentación con tecnologías de privacidad

#### Restricciones Importantes
- ⚠️ **NO para uso en producción sin modificaciones**
- ⚠️ **NO para actividades ilegales**
- ⚠️ **SIN GARANTÍA** - Proporcionado "TAL CUAL"
- ⚠️ El desarrollador NO es responsable del contenido de los usuarios
- ⚠️ El desarrollador NO puede acceder, recuperar o controlar mensajes

### 🤝 Contribuciones

Este es un proyecto de portafolio personal. Si encuentras bugs o tienes sugerencias:

1. Abre un Issue describiendo el problema o mejora
2. Si deseas contribuir, haz un Fork del proyecto
3. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
4. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
5. Push a la rama (`git push origin feature/AmazingFeature`)
6. Abre un Pull Request

### 👨‍💻 Autor

**OrmazabalDev**
- GitHub: [@OrmazabalDev](https://github.com/OrmazabalDev)
- Portfolio: [Tu sitio web]

### 📧 Contacto

Para preguntas sobre el proyecto, por favor abre un Issue en GitHub.

### ⚠️ Descargo de Responsabilidad

Este software es un proyecto de demostración. El desarrollador:
- NO recopila datos personales
- NO monitorea conversaciones
- NO puede recuperar mensajes eliminados
- NO es responsable del uso que se le dé a la aplicación
- NO respalda ninguna comunicación de usuarios

**Usa bajo tu propia responsabilidad.**

---

## 🇬🇧 English Version

### 📋 Description

**DarkWhisper** is a real-time chat application that prioritizes privacy and anonymity. Designed for educational purposes and portfolio demonstration, it implements end-to-end encryption (E2EE) and automatic message deletion every 60 seconds.

### ✨ Key Features

- 🔐 **End-to-End Encryption**: All messages encrypted with 256-bit AES-GCM
- ⏱️ **Auto-deletion**: Messages automatically deleted after 60 seconds
- 👤 **100% Anonymous**: No registration, no history, no personal data
- 🌐 **Cross-platform**: Available as web and desktop app (Electron)
- 📎 **File Sharing**: Support for images, videos, audio, and documents
- 👥 **Real-time Presence**: See how many users are connected
- 💬 **Typing Indicator**: Notification when other users are typing
- 🎨 **Modern UI**: Dark interface designed with Tailwind CSS
- ⚡ **Real-time**: Instant synchronization with Firebase Realtime Database

### 🛠️ Tech Stack

#### Frontend
- **React 18.2** - UI library
- **TypeScript 5.2** - Static typing and better DX
- **Vite 5.0** - Next-generation build tool
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Lucide React** - Modern customizable icons

#### Backend & Services
- **Firebase 10.7**
  - Authentication (Anonymous)
  - Realtime Database (Messages and presence)
  - Storage (Media files)
- **Web Crypto API** - Client-side AES-GCM encryption

#### Desktop
- **Electron 39.2** - Cross-platform desktop app
- **Electron Builder** - Packaging and distribution

### 🔒 Security & Privacy

#### Encryption
- **Algorithm**: 256-bit AES-GCM
- **Key derivation**: PBKDF2 with 310,000 iterations
- **Initialization vectors**: Unique per message
- **Location**: All encryption happens client-side

#### Privacy
- ✅ No user registration
- ✅ No history storage
- ✅ No personal data collection
- ✅ Auto-delete messages (60s)
- ✅ Auto-delete files (5 minutes)
- ✅ No server logs
- ✅ No user tracking

### 📦 Installation & Usage

#### Prerequisites
- Node.js 18+ and npm
- Firebase account (for configuration)
- Git

#### Setup

1. **Clone the repository**
```bash
git clone https://github.com/OrmazabalDev/whisperchat.git
cd whisperchat
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure Firebase**

Create a `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

4. **Configure Firebase rules**

Apply security rules from `database.rules.json` and `firebase.json` to your Firebase project.

#### Available Scripts

```bash
# Web development
npm run dev

# Production build
npm run build

# Build preview
npm run preview

# Electron development
npm run electron:dev

# Electron build
npm run electron:build

# Deploy to GitHub Pages
npm run deploy
```

### 🏗️ Project Structure

```
whisperchat/
├── src/
│   ├── components/
│   │   ├── chat/          # Messaging components
│   │   ├── layout/        # Layout components
│   │   └── ui/            # Reusable UI components
│   ├── contexts/          # React Context (Auth, Chat, Crypto)
│   ├── hooks/             # Custom React Hooks
│   ├── services/          # Services (Auth, DB, Crypto, Storage)
│   ├── types/             # TypeScript definitions
│   └── utils/             # Utilities and helpers
├── electron.cjs           # Electron configuration
├── firebase.json          # Firebase configuration
├── database.rules.json    # Firebase security rules
└── vite.config.ts         # Vite configuration
```

### 📱 Detailed Features

#### Authentication
- Automatic anonymous login with Firebase Auth
- Random nickname generation
- Persistent session management

#### Messaging
- Real-time send and receive
- E2EE encryption with shared key
- Auto-deletion after 60 seconds
- Message length validation (max 1000 chars)
- Multi-line support

#### Multimedia
- Image upload (JPEG, PNG, GIF, WebP)
- Video upload (MP4, WebM, MOV, AVI)
- Audio upload (MP3, WAV, OGG, M4A)
- Document upload (PDF, DOC, DOCX, TXT, etc.)
- Size limit: 10 MB
- Auto-deletion after 5 minutes

#### Presence
- Real-time active user counter
- Heartbeat system every 30 seconds
- Auto-cleanup of inactive users

#### Typing Status
- Visual indicator when other users are typing
- Auto-timeout after 3 seconds

### ⚖️ License & Legal Use

**License**: Proprietary - Portfolio Project

© 2025 DarkWhisper - Developed by **OrmazabalDev**

This software is protected by a custom End User License Agreement (EULA). See `LICENSE.txt` for complete terms.

#### Purpose
This project is for:
- ✅ **Portfolio** - Technical skills demonstration
- ✅ **Education** - Learning encryption and real-time communication
- ✅ **Testing** - Experimentation with privacy technologies

#### Important Restrictions
- ⚠️ **NOT for production use without modifications**
- ⚠️ **NOT for illegal activities**
- ⚠️ **NO WARRANTY** - Provided "AS IS"
- ⚠️ Developer is NOT responsible for user content
- ⚠️ Developer CANNOT access, recover, or control messages

### 🤝 Contributions

This is a personal portfolio project. If you find bugs or have suggestions:

1. Open an Issue describing the problem or improvement
2. If you wish to contribute, Fork the project
3. Create a branch for your feature (`git checkout -b feature/AmazingFeature`)
4. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
5. Push to the branch (`git push origin feature/AmazingFeature`)
6. Open a Pull Request

### 👨‍💻 Author

**OrmazabalDev**
- GitHub: [@OrmazabalDev](https://github.com/OrmazabalDev)
- Portfolio: [Your website]

### 📧 Contact

For questions about the project, please open an Issue on GitHub.

### ⚠️ Disclaimer

This software is a demonstration project. The developer:
- Does NOT collect personal data
- Does NOT monitor conversations
- CANNOT recover deleted messages
- Is NOT responsible for how the application is used
- Does NOT endorse any user communications

**Use at your own risk.**

---

<div align="center">

**Made with ❤️ by OrmazabalDev**

⭐ If you find this project useful, please give it a star!

</div>
