<h1 align="center">🕵️ DarkWhisper - Chat Encriptado Anónimo</h1>

<div align="center">

<img src="https://img.shields.io/badge/license-Proprietary-red" alt="License" />
<img src="https://img.shields.io/badge/version-1.0.0-blue" alt="Version" />
<img src="https://img.shields.io/badge/last%20update-02%2F12%2F2025-green" alt="Last Update" />
<img src="https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-5.2.2-3178C6?logo=typescript" alt="TypeScript" />
<img src="https://img.shields.io/badge/Firebase-10.7.1-FFCA28?logo=firebase" alt="Firebase" />
<img src="https://img.shields.io/badge/Electron-39.2.4-47848F?logo=electron" alt="Electron" />

<p><strong>Una aplicación de chat anónimo con cifrado de extremo a extremo y auto-eliminación de mensajes</strong></p>

</div>

<hr />

<h2>🇪🇸 Versión en Español</h2>

<h3>📋 Descripción</h3>

<p><strong>DarkWhisper</strong> es una aplicación de chat en tiempo real que prioriza la privacidad y el anonimato. Diseñada con fines educativos y de demostración de portafolio, implementa <strong>cifrado de extremo a extremo (E2EE)</strong> y <strong>auto-eliminación automática de mensajes cada 120 segundos</strong>. Es ideal para mostrar habilidades en seguridad, comunicación en tiempo real y desarrollo multiplataforma.</p>

<h3>✨ Características Principales</h3>

<ul>
  <li>🔐 <strong>Cifrado de Extremo a Extremo</strong>: Todos los mensajes se cifran con <strong>AES-GCM de 256 bits</strong> del lado del cliente.</li>
  <li>⏱️ <strong>Auto-eliminación</strong>: Los mensajes y archivos se eliminan automáticamente después de <strong>120 segundos</strong>.</li>
  <li>🗣️ <strong>Traducción en Tiempo Real</strong>: Traducción automática de mensajes entre <strong>12 idiomas</strong> diferentes.</li>
  <li>👤 <strong>100% Anónimo</strong>: Sin registro de usuarios, sin historial, sin datos personales.</li>
  <li>🌐 <strong>Multi-plataforma</strong>: Disponible como aplicación web y de escritorio (<strong>Electron</strong>).</li>
  <li>📎 <strong>Envío de archivos</strong>: Soporte cifrado para imágenes y documentos (<strong>PDF, TXT</strong>), almacenados como Base64.</li>
  <li>👥 <strong>Presencia en tiempo real</strong>: Visualiza cuántos usuarios están conectados.</li>
  <li>🔊 <strong>Sonidos Sintetizados</strong>: Notificaciones de audio generadas en tiempo real (<strong>Web Audio API</strong>).</li>
  <li>💬 <strong>Indicador de escritura</strong>: Notificación cuando otros usuarios están escribiendo.</li>
  <li>🎨 <strong>UI Moderna</strong>: Interfaz oscura "Cyberpunk" diseñada con <strong>Tailwind CSS</strong>.</li>
</ul>

<hr />

<h3>🛠️ Tecnologías Utilizadas</h3>

<h4>Frontend</h4>
<ul>
  <li><strong>React 18.2</strong> - Biblioteca principal de interfaz de usuario.</li>
  <li><strong>TypeScript 5.2</strong> - Para tipado estático y mejor mantenibilidad.</li>
  <li><strong>Vite 5.0</strong> - Herramienta de construcción de alta velocidad.</li>
  <li><strong>Tailwind CSS 4.1</strong> - Framework de CSS utility-first para diseño rápido.</li>
</ul>

<h4>Backend & Servicios</h4>
<ul>
  <li><strong>Firebase 10.7</strong>
    <ul>
      <li><strong>Authentication</strong> (Anónima)</li>
      <li><strong>Realtime Database</strong> (Mensajes, presencia y almacenamiento de archivos en <strong>Base64</strong> - <em>No utiliza Storage</em>).</li>
    </ul>
  </li>
  <li><strong>Web Crypto API</strong> - Implementación nativa del navegador para el cifrado.</li>
  <li><strong>Web Audio API</strong> - Para la generación de efectos de sonido.
  <li><strong>Google Translate API</strong> (vía fetch) - Para la funcionalidad de traducción.</li>
</ul>

<h4>Desktop</h4>
<ul>
  <li><strong>Electron 39.2</strong> - Para crear la aplicación de escritorio.</li>
  <li><strong>Electron Builder</strong> - Para el empaquetado y la distribución.</li>
</ul>

<hr />

<h3>🔒 Seguridad y Privacidad</h3>

<h4>Cifrado</h4>
<ul>
  <li><strong>Algoritmo</strong>: AES-GCM de 256 bits.</li>
  <li><strong>Derivación de clave</strong>: PBKDF2 con 310,000 iteraciones.</li>
  <li><strong>Vectores de inicialización</strong>: Únicos para cada mensaje, asegurando que dos mensajes idénticos tengan cifrados diferentes.</li>
  <li><strong>Ubicación</strong>: Todo el cifrado y descifrado ocurre <strong>en el cliente</strong> antes de enviar y después de recibir.</li>
</ul>

<h4>Privacidad</h4>
<ul>
  <li>✅ Sin registro de usuarios</li>
  <li>✅ Sin almacenamiento de historial (Auto-eliminación cada 120s)</li>
  <li>✅ Sin recopilación de datos personales</li>
  <li>✅ Sin logs del servidor</li>
  <li>✅ Sin seguimiento de usuarios</li>
</ul>

<hr />

<h3>📦 Instalación y Uso</h3>

<h4>Requisitos Previos</h4>
<ul>
  <li>Node.js 18+ y npm</li>
  <li>Cuenta de Firebase (para configuración)</li>
  <li>Git</li>
</ul>

<h4>Configuración</h4>

<ol>
  <li>
    <p><strong>Clonar el repositorio</strong></p>
    <pre><code class="language-bash">git clone https://github.com/OrmazabalDev/whisperchat.git
cd whisperchat</code></pre>
  </li>
  <li>
    <p><strong>Instalar dependencias</strong></p>
    <pre><code class="language-bash">npm install</code></pre>
  </li>
  <li>
    <p><strong>Configurar Firebase</strong></p>
    <p>Crea un archivo <code>.env</code> en la raíz del proyecto con tus credenciales:</p>
    <pre><code class="language-env">VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_auth_domain
VITE_FIREBASE_DATABASE_URL=tu_database_url
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_messaging_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
VITE_FIREBASE_MEASUREMENT_ID=tu_measurement_id</code></pre>
  </li>
  <li>
    <p><strong>Configurar reglas de Firebase</strong></p>
    <p>Aplica las reglas de seguridad desde <code>database.rules.json</code> y <code>firebase.json</code> a tu proyecto Firebase para asegurar el acceso correcto a la base de datos.</p>
  </li>
</ol>

<h4>Scripts Disponibles</h4>

<pre><code class="language-bash"># Inicia el servidor de desarrollo web
npm run dev

# Genera el build de producción web
npm run build

# Previsualiza el build de producción
npm run preview

# Inicia el desarrollo con Electron
npm run electron:dev

# Genera el build de escritorio con Electron
npm run electron:build

# Despliega a GitHub Pages
npm run deploy</code></pre>

<hr />

<h3>📱 Funcionalidades Detalladas</h3>

<h4>Mensajería</h4>
<ul>
  <li>Envío y recepción en tiempo real.</li>
  <li>Cifrado E2EE con clave compartida.</li>
  <li>Auto-eliminación estricta después de <strong>120 segundos</strong>.</li>
  <li>Sistema de traducción integrado.</li>
  <li>Validación de longitud de mensaje (máx. 1000 caracteres).</li>
</ul>

<h4>Multimedia</h4>
<ul>
  <li>Subida de imágenes (JPEG, PNG, GIF, WebP) y documentos (PDF, TXT).</li>
  <li>Almacenamiento directo en <strong>Realtime Database</strong> (Base64).</li>
  <li>Límite de tamaño: <strong>2 MB</strong> (Optimizado para la RTDB).</li>
  <li>Se elimina automáticamente junto con el mensaje (120s).</li>
</ul>

<h4>Presencia</h4>
<ul>
  <li>Contador de usuarios activos y sistema de <strong>heartbeat</strong> para auto-limpieza.</li>
</ul>

<hr />

<h3>⚖️ Licencia y Uso Legal</h3>

<p><strong>Licencia</strong>: Propietaria - Proyecto de Portafolio</p>

<p>© 2025 DarkWhisper - Desarrollado por <strong>OrmazabalDev</strong></p>

<h4>Descargo de Responsabilidad</h4>

<p>Este software es un proyecto de demostración técnica. El desarrollador <strong>NO es responsable</strong> del uso que se le dé a la aplicación ni del contenido de los usuarios.</p>

<p><strong>Usa bajo tu propia responsabilidad.</strong></p>

<hr />

<h3>👨‍💻 Autor</h3>

<p><strong>OrmazabalDev</strong></p>
<ul>
  <li>GitHub: <a href="https://github.com/OrmazabalDev">@OrmazabalDev</a></li>
  <li>Portfolio: <a href="https://ormazabaldev.github.io/devportfolio-master/">https://ormazabaldev.github.io/devportfolio-master/</a></li>
</ul>

<hr />

<div align="center">

<p><strong>Hecho con ❤️ por OrmazabalDev</strong></p>

<p>⭐ Si este proyecto te parece útil, ¡déjale una estrella!</p>

</div>
