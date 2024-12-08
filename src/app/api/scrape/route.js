import { createProgressTracker } from '../../../lib/progress';
import { scrapePage } from '../../../lib/scraper';

export async function GET(request) {
    const url = new URL(request.url).searchParams.get('url');
    const productName = new URL(request.url).searchParams.get('productName');
    const brandName = new URL(request.url).searchParams.get('brandName');

    if (!url || !productName) {
        return new Response(
            JSON.stringify({ error: 'URL and productName are required' }),
            { status: 400 }
        );
    }

    const progress = createProgressTracker();

    try {
        const results = await scrapePage(url, productName, brandName, progress);

        return new Response(
            JSON.stringify({
                progress: progress.get(),
                results,
            }),
            { status: 200 }
        );
    } catch (error) {
        return new Response(
            JSON.stringify({
                progress: progress.get(),
                error: error.message,
            }),
            { status: 500 }
        );
    }
}
