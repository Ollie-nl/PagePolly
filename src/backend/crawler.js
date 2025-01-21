const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const { getRandomUserAgent } = require('./userAgents');

puppeteer.use(StealthPlugin());

const saveToFileIncrementally = (data, filename = 'crawled_data.json') => {
  const existingData = fs.existsSync(filename) ? JSON.parse(fs.readFileSync(filename, 'utf-8')) : [];
  const updatedData = [...existingData, ...data];
  fs.writeFileSync(filename, JSON.stringify(updatedData, null, 2), 'utf-8');
};

const startCrawl = async (startUrl, maxPages = 1000, depth = 1, progressCallback = () => {}) => {
  console.log(`Starting crawl for: ${startUrl} | Max Pages: ${maxPages} | Depth: ${depth}`);
  const visitedUrls = new Set();
  const toVisitQueue = [{ url: startUrl, currentDepth: 0 }];
  const results = [];

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    while (toVisitQueue.length > 0 && visitedUrls.size < maxPages) {
      const currentTask = toVisitQueue.shift();
      if (!currentTask || !currentTask.url) {
        console.error("Invalid task in queue:", currentTask);
        continue; // Sla over als er iets mis is met de taak
      }

      const { url, currentDepth } = currentTask;

      // Update progress voor de huidige URL
      progressCallback({
        totalPages: maxPages,
        crawledPages: visitedUrls.size,
        currentUrl: url,
      });
      console.log('Progress callback:', {
        totalPages: maxPages,
        crawledPages: visitedUrls.size,
        currentUrl: url,
      });

      if (visitedUrls.has(url) || currentDepth > depth) continue;

      visitedUrls.add(url);
      console.log(`Crawling URL: ${url} at depth: ${currentDepth}`);

      const page = await browser.newPage();
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded' });

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

        results.push(pageData);

        // Update voortgang na succesvolle verwerking
        progressCallback({
          totalPages: maxPages,
          crawledPages: visitedUrls.size,
          currentUrl: url,
        });

        console.log(`Crawled URL: ${url}, Total Crawled: ${visitedUrls.size}`);

        const links = pageData.links || [];
        if (currentDepth < depth) {
          links.forEach((link) => {
            if (!visitedUrls.has(link) && !toVisitQueue.some((q) => q.url === link)) {
              toVisitQueue.push({ url: link, currentDepth: currentDepth + 1 });
            }
          });
        }
      } catch (err) {
        console.error(`Error crawling ${url}:`, err.message);
      } finally {
        await page.close();
      }
    }
  } catch (error) {
    console.error('Crawling error:', error.message);
    throw error; // Gooi de fout door naar de backend
  } finally {
    await browser.close();
  }

  return results;
};

module.exports = { startCrawl };
