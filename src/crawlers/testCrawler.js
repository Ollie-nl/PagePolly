const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');

// Gebruik de stealth-plugin om detectie te verminderen
puppeteer.use(StealthPlugin());

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Vervang de URL door de site die je wilt crawlen
  const url = 'https://ferrum.audio';
  console.log(`Navigating to: ${url}`);
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  // Haal de paginatitel op
  const title = await page.title();
  console.log(`Page Title: ${title}`);

  // Haal alle links op de pagina op
  const links = await page.$$eval('a', anchors =>
    anchors.map(anchor => anchor.href)
  );
  console.log(`Found ${links.length} links:`);
  console.log(links);

  await browser.close();
})();
