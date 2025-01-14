const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Gebruik de stealth-plugin om detectie te verminderen
puppeteer.use(StealthPlugin());

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36',
];

function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

function sleep(ms) {
  console.log(`Pausing for ${ms}ms...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function performHumanActions(page) {
  console.log('Simulating human-like actions...');
  console.log('Moving mouse to (100, 100)');
  await page.mouse.move(100, 100);
  await sleep(1000);

  console.log('Moving mouse to (200, 200)');
  await page.mouse.move(200, 200);
  await sleep(1000);

  console.log('Scrolling down by half the viewport height');
  await page.evaluate(() => {
    window.scrollBy(0, window.innerHeight / 2);
  });
  await sleep(1500);
}

async function crawlPage(page, url, depth, maxDepth) {
  if (depth > maxDepth) {
    return [];
  }

  console.log(`Crawling: ${url} at depth ${depth}`);

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    const links = await page.$$eval('a', anchors =>
      anchors.map(anchor => anchor.href)
    );

    console.log(`Found ${links.length} links on ${url}`);

    const results = [{ url, title, depth, links }];

    for (const link of links) {
      if (depth + 1 <= maxDepth) {
        const subResults = await crawlPage(page, link, depth + 1, maxDepth);
        results.push(...subResults);
      }
    }

    return results;
  } catch (err) {
    console.error(`Failed to crawl ${url}:`, err.message);
    return [];
  }
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  const userAgent = getRandomUserAgent();
  console.log(`Using User Agent: ${userAgent}`);
  await page.setUserAgent(userAgent);

  const startUrl = 'https://ferrum.audio';
  const maxDepth = 2;

  console.log(`Starting crawl at: ${startUrl} with max depth ${maxDepth}`);
  const results = await crawlPage(page, startUrl, 0, maxDepth);

  console.log('Crawl completed. Results:', results);

  await browser.close();
})();