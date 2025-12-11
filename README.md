# 📄 Scraper À Punt (apuntmedia/crawl.mjs)

Script en Node.js con Playwright (`crawl.mjs`) que recorre secciones de À Punt, extrae noticias, y guarda HTML, texto plano, Markdown e índice JSON por sección y fecha.

## 🚀 Qué hace
- Navega con Chromium headless las secciones configuradas (`politica`, `societat`, `cultura`, `economia`, `igualtat`, `mon`).
- Scroll infinito para cargar todas las noticias de la página de sección.
- Extrae título, subtítulo, fecha y cuerpo (`div.ap-body p`), detecta si hay vídeo (`<video>`).
- Guarda HTML parcial del cuerpo, TXT, Markdown e índice JSON con rutas relativas.
- Organización por sección y fecha de ejecución.

## 📁 Estructura de salida
```
crawl/{seccion}/
├── index.json                      # Índice de la sección
└── {fecha}/
    ├── html/{YYYY-MM-DD}/*.html    # HTML del cuerpo
    ├── plain/{YYYY-MM-DD}/*.txt    # Texto plano
    └── markdown/{YYYY-MM-DD}/*.md  # Markdown
```

## 🧰 Requisitos
- Node.js 18+.
- Dependencias: `playwright`, `turndown`, `path` (nativo), `fs` (nativo).

Instalación rápida:
```bash
npm install playwright turndown
# o npm ci si ya tienes package-lock
```

## ▶️ Ejecución
```bash
node crawl.mjs
```
Por defecto usa Chromium en modo headless y tiempos de espera de 40s por página/noticia.

## 🧠 Flujo del script
1) Itera las secciones definidas en `secciones` (URL + carpeta destino).  
2) En cada sección:
   - Visita la URL, hace scroll hasta no aumentar el `scrollHeight`.  
   - Captura todos los enlaces de noticias (`div.content-info h2 a.title`).  
3) Para cada noticia:
   - Navega al enlace, extrae `title`, `subtitle`, `date`, `content` y `html` del cuerpo.  
   - Guarda archivos: HTML del cuerpo, TXT del contenido, y MD con Turndown.  
   - Actualiza `index.json` de la sección con rutas relativas y metadatos (fecha, idioma por defecto `VA`).  
4) Repite para todas las secciones; cierra el navegador al final.

## ⚙️ Configuración rápida
- Ajusta `secciones` para añadir/quitar URLs o nombres de carpeta.
- Puedes añadir más metadatos (ej. flag de vídeo) en `newsData` si lo necesitas.
- Esperas: scroll con pausas de 10s; navegación con timeout de 40s.

## 💰 Financiación
- (pendiente)

## 🙏 Agradecimientos
- (pendiente)

## ⚠️ Aviso legal
Tenga en cuenta que los datos pueden contener sesgos u otras distorsiones no deseadas. Cuando terceros desplieguen sistemas o presten servicios basados en estos datos, o los utilicen directamente, serán responsables de mitigar los riesgos asociados y de garantizar el cumplimiento de la normativa aplicable, incluida aquella relacionada con el uso de la Inteligencia Artificial.

La Universidad de Alicante, como propietaria y creadora del conjunto de datos, no será responsable de los resultados derivados del uso por parte de terceros.

## 📜 Licencia
Este proyecto se distribuye bajo la licencia Apache 2.0.
