import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import TurndownService from 'turndown'; // Importar Turndown

const turndownService = new TurndownService();

// Lista de secciones a procesar
const secciones = [
    { url: 'https://www.apuntmedia.es/noticies/politica/', carpeta: 'politicaNew' },
    { url: 'https://www.apuntmedia.es/noticies/societat/', carpeta: 'societatNew' },
    { url: 'https://www.apuntmedia.es/noticies/cultura/', carpeta: 'culturaNew' },
    { url: 'https://www.apuntmedia.es/noticies/economia/', carpeta: 'economiaNew' },
    { url: 'https://www.apuntmedia.es/noticies/igualtat/', carpeta: 'igualtatNew' },
    { url: 'https://www.apuntmedia.es/noticies/mon/', carpeta: 'monNew' }

];

async function procesarSeccion(browser, seccion) {
    console.log(`Iniciando procesamiento de la sección: ${seccion.carpeta}`);

    const page = await browser.newPage();

    console.log(`Navegando a la página: ${seccion.url}`);
    await page.goto(seccion.url);

    let previousHeight;
    do {
        previousHeight = await page.evaluate(() => document.body.scrollHeight);
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(10000);
    } while ((await page.evaluate(() => document.body.scrollHeight)) > previousHeight);

    console.log('Extrayendo enlaces de noticias...');
    const newsLinks = await page.$$eval('div.content-info h2 a.title', links =>
        links.map(link => ({ title: link.innerText, url: link.href }))
    );

    console.log(`Se encontraron ${newsLinks.length} noticias en la sección ${seccion.carpeta}.`);

    const newsData = {};
    const dateStr = new Date().toISOString().split('T')[0]; // Fecha del último crawl

    // Crear directorio base para esta sección si no existe
    const seccionDir = path.join('crawl', seccion.carpeta);
    fs.mkdirSync(seccionDir, { recursive: true });

    for (let id = 1; id <= newsLinks.length; id++) {
        const { title, url } = newsLinks[id - 1];
        const idStr = id < 100 ? id.toString().padStart(3, '0') : id.toString();

        console.log(`Procesando noticia ${id} de ${newsLinks.length}: ${url}`);

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 40000 });
            const hasVideo = await page.$('video') !== null;

            const articleData = await page.evaluate(() => {
                const titleEl = document.querySelector('h1.title.aside-anchor');
                const subtitleEl = document.querySelector('p.subtitle');
                const dateEl = document.querySelector('div.date span.published');
                const contentEls = Array.from(document.querySelectorAll('div.ap-body p'));

                if (!titleEl || !subtitleEl || !dateEl || contentEls.length === 0) return null;

                return {
                    title: titleEl.innerText,
                    subtitle: subtitleEl.innerText,
                    date: dateEl.innerText,
                    content: contentEls.map(p => p.innerText).join('\n'),
                    html: document.querySelector('div.ap-body').innerHTML
                };
            });

            if (articleData) {
                const { title, subtitle, date, content, html } = articleData;

                // Crear directorios específicos para esta sección
                const htmlDir = path.join(seccionDir, 'html', dateStr);
                const plainDir = path.join(seccionDir, 'plain', dateStr);
                const mdDir = path.join(seccionDir, 'markdown', dateStr);
                fs.mkdirSync(htmlDir, { recursive: true });
                fs.mkdirSync(plainDir, { recursive: true });
                fs.mkdirSync(mdDir, { recursive: true });

                // Guardar HTML
                const htmlPath = path.join(htmlDir, `${idStr}.html`);
                fs.writeFileSync(htmlPath, html, 'utf-8');

                // Guardar texto plano
                const plainPath = path.join(plainDir, `${idStr}.txt`);
                fs.writeFileSync(plainPath, content, 'utf-8');

                // Guardar Markdown
                const mdPath = path.join(mdDir, `${idStr}.md`);
                const markdownContent = turndownService.turndown(html);
                fs.writeFileSync(mdPath, markdownContent, 'utf-8');

                // Guardar información en el JSON
                newsData[`${dateStr}/${idStr}`] = {
                    title,
                    subtitle,
                    date,
                    language: ["VA"], // Ajusta esto según sea necesario
                    path2html: htmlPath.replace(/^crawl\/[^/]+\//, ''),  // Quita el prefijo del path para mantener rutas relativas
                    path2plain: plainPath.replace(/^crawl\/[^/]+\//, ''),
                    path2md: mdPath.replace(/^crawl\/[^/]+\//, '')
                };
            } else {
                console.log(`Omitiendo noticia sin contenido: ${url}`);
            }
        } catch (error) {
            console.error(`Error en la noticia ${url}:`, error);
        }
    }

    // Escribir el JSON para esta sección
    console.log(`Escribiendo datos en el archivo JSON para la sección ${seccion.carpeta}...`);
    fs.writeFileSync(path.join(seccionDir, 'index.json'), JSON.stringify(newsData, null, 4), 'utf-8');

    await page.close();
    console.log(`Procesamiento de la sección ${seccion.carpeta} completado.`);
}

(async () => {
    const browser = await chromium.launch({ headless: true });

    // Procesar cada sección en secuencia
    for (const seccion of secciones) {
        await procesarSeccion(browser, seccion);
    }

    console.log('Cerrando el navegador...');
    await browser.close();

    console.log('Proceso completo. Se han procesado todas las secciones.');
})();
