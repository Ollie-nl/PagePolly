import puppeteer from 'puppeteer';

export async function GET(request) {
    const url = new URL(request.url).searchParams.get('url');
    if (!url) {
        return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400 });
    }

    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        await page.goto(url);
        const title = await page.title();
        await browser.close();

        return new Response(JSON.stringify({ title }), { status: 200 });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
}
