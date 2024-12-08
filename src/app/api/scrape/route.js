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

    const stream = new ReadableStream({
        start(controller) {
            const progress = {
                add(message) {
                    const event = `data: ${JSON.stringify({ message })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(event));
                },
            };

            scrapePage(url, productName, brandName, progress)
                .then((results) => {
                    const event = `data: ${JSON.stringify({ done: true, results })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(event));
                    controller.close();
                })
                .catch((error) => {
                    const event = `data: ${JSON.stringify({ error: error.message })}\n\n`;
                    controller.enqueue(new TextEncoder().encode(event));
                    controller.close();
                });
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
        },
    });
}
