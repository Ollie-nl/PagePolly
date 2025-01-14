const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

puppeteer.use(StealthPlugin());

async function startCrawler(url, maxDepth) {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    const visited = new Set();
  
    async function crawl(currentUrl, depth) {
      if (depth > maxDepth || visited.has(currentUrl)) return [];
      visited.add(currentUrl);
  
      try {
        console.log(`Crawling: ${currentUrl} at depth ${depth}`);
        await page.goto(currentUrl, { waitUntil: 'domcontentloaded' });
  
        const title = await page.title();
        const links = await page.$$eval('a', anchors =>
          anchors
            .map(anchor => anchor.href)
            .filter(link => link.startsWith('http') && !link.startsWith('mailto:') && !link.startsWith('tel:')) // Filter alleen http/https links
        );
  
        const results = [{ url: currentUrl, title, depth, links }];
        for (const link of links) {
          const subResults = await crawl(link, depth + 1);
          results.push(...subResults);
        }
        return results;
      } catch (err) {
        console.error(`Error crawling ${currentUrl}:`, err.message);
        return [];
      }
    }

  const results = await crawl(url, 0);
  await browser.close();
  return results;
}

module.exports = { startCrawler };
