import puppeteer from 'puppeteer';
import { delay } from './utils';

export async function scrapePage(url, productName, brandName, progress) {
    const results = [];
    const visited = new Set(); // Houd bij welke URL's al zijn bezocht
    const maxPages = 50;

    async function scrapeSinglePage(currentUrl) {
        if (visited.has(currentUrl)) return; // Skip als al bezocht

        if (visited.size >= maxPages) {
            progress.add(`Maximaal aantal pagina's bereikt (${maxPages}).`);
            return;
        }
        visited.add(currentUrl); // Markeer als bezocht

        progress.add(`Bezig met openen van pagina: ${currentUrl}`);
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        try {
            await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });

            // Vertraging om blokkades te voorkomen
            progress.add(`Wachten om blokkade te voorkomen op pagina: ${currentUrl}`);
            await delay(2000);

            // Pagina-inhoud analyseren
            progress.add(`Analyseren van inhoud op pagina: ${currentUrl}`);
            const content = await page.content();
            const pageTitle = await page.title();
            const headings = await page.evaluate(() =>
                Array.from(document.querySelectorAll('h1, h2, h3')).map((h) => h.textContent)
            );
            const paragraphs = await page.evaluate(() =>
                Array.from(document.querySelectorAll('p')).map((p) => p.textContent)
            );

            // Controleer op matches
            const matches = [];
            if (productName && pageTitle.toLowerCase().includes(productName.toLowerCase())) {
                matches.push({ type: 'title', content: pageTitle });
            }
            headings.forEach((heading) => {
                if (heading.toLowerCase().includes(productName.toLowerCase())) {
                    matches.push({ type: 'heading', content: heading });
                }
            });
            paragraphs.forEach((paragraph) => {
                if (paragraph.toLowerCase().includes(productName.toLowerCase())) {
                    matches.push({ type: 'paragraph', content: paragraph });
                }
            });

            // Resultaten verwerken
            if (matches.length > 0) {
                progress.add(`✅ Product gevonden op pagina: ${currentUrl}`);
                matches.forEach((match) => {
                    progress.add(`- Type: ${match.type}, Inhoud: ${match.content}`);
                });
                results.push({ url: currentUrl, matches });
            } else {
                progress.add(`❌ Geen product gevonden op pagina: ${currentUrl}`);
            }

            // Verzamel interne links
            const links = await page.evaluate(() =>
                Array.from(document.querySelectorAll('a'))
                    .map((a) => a.href)
                    .filter((href) => href.startsWith(window.location.origin))
            );

            progress.add(`Gevonden links op pagina (${currentUrl}): ${links.length}`);
            await browser.close();

            // Crawlen van interne links
            for (const link of links) {
                await scrapeSinglePage(link);
            }
        } catch (error) {
            progress.add(`⚠️ Fout bij verwerken van pagina: ${currentUrl} - ${error.message}`);
        } finally {
            await browser.close();
        }
    }

    await scrapeSinglePage(url);
    return results;
}
