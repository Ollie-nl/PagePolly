import puppeteer from 'puppeteer';

export async function GET(request) {
    try {
        // Query parameters ophalen
        const url = new URL(request.url).searchParams.get('url');
        const productName = new URL(request.url).searchParams.get('productName');
        const brandName = new URL(request.url).searchParams.get('brandName');

        // Valideer invoer
        if (!url) {
            return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
        }

        // Start Puppeteer
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });
        const page = await browser.newPage();

        // Laad de opgegeven URL
        await page.goto(url, { waitUntil: 'domcontentloaded' });

        // Haal HTML-inhoud op
        const pageContent = await page.content();

        // Zoek naar product- en merknamen
        const found = [];
        if (productName && pageContent.includes(productName)) {
            found.push({ type: 'productName', match: productName });
        }
        if (brandName && pageContent.includes(brandName)) {
            found.push({ type: 'brandName', match: brandName });
        }

        // Sluit de browser
        await browser.close();

        // Geef resultaten terug
        return new Response(
            JSON.stringify({
                found,
                url,
            }),
            { status: 200 }
        );
    } catch (error) {
        // Foutafhandeling
        return new Response(
            JSON.stringify({
                error: error.message,
            }),
            { status: 500 }
        );
    }
}
