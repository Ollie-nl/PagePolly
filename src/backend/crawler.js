const puppeteer = require('puppeteer-extra'); // Zorg dat puppeteer-extra is geïnstalleerd
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const { getRandomUserAgent } = require('./userAgents'); // Zorg dat userAgents.js correct is

puppeteer.use(StealthPlugin());

const fs = require('fs');

// Helperfunctie om tussentijds data op te slaan
const saveToFileIncrementally = (data, filename = 'crawled_data.json') => {
  const existingData = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf-8')) : [];
  const updatedData = [...existingData, ...data];
  fs.writeFileSync(filename, JSON.stringify(updatedData, null, 2), 'utf-8');
};

const startCrawl = async (startUrl, maxPages = 1000, progressCallback = () => {}) => {
  console.log(`Starting crawl for: ${startUrl} with maxPages: ${maxPages}`);
  const visitedUrls = new Set();
  const toVisitQueue = [startUrl];
  const results = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    while (toVisitQueue.length > 0 && visitedUrls.size < maxPages) {
      const url = toVisitQueue.shift();
      console.log(`Crawling: ${url}`);

      if (visitedUrls.has(url)) {
        console.log(`Already visited: ${url}`);
        continue;
      }

      visitedUrls.add(url);

      const page = await browser.newPage();
      const randomUserAgent = getRandomUserAgent();
      await page.setUserAgent(randomUserAgent);

      try {
        const startTime = Date.now();
        await page.goto(url, { waitUntil: 'domcontentloaded' });
        const responseTime = Date.now() - startTime;

        const pageData = await page.evaluate(() => {
          const getTextContent = (selector) =>
            [...document.querySelectorAll(selector)].map((el) => el.innerText.trim()).filter(Boolean);
          const getLinks = () =>
            [...document.querySelectorAll('a')].map((a) => a.href).filter((link) => link.startsWith('http'));

          return {
            url: document.location.href,
            title: document.title,
            content: document.body.innerText,
            meta: {
              description: document.querySelector('meta[name="description"]')?.content || 'No description',
              keywords: document.querySelector('meta[name="keywords"]')?.content || 'No keywords',
            },
            headings: getTextContent('h1, h2, h3, h4, h5, h6'),
            paragraphs: getTextContent('p'),
            links: getLinks(),
          };
        });

        pageData.responseTime = responseTime;

        results.push(pageData);

        // Update progress
        progressCallback({
          totalPages: maxPages,
          crawledPages: visitedUrls.size,
          currentUrl: url,
        });

        console.log(`Crawled: ${url}, Total Crawled: ${visitedUrls.size}`);
      } catch (err) {
        console.error(`Error crawling ${url}:`, err.message);
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error('Crawling error:', error.message);
  } finally {
    await browser.close();
  }

  return results;
};


module.exports = { startCrawl };
