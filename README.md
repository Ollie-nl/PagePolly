# PagePolly

PagePolly is a powerful and extensible web crawler built using Puppeteer and Node.js. It allows you to crawl entire websites for text-based content, save the results in a structured database, and customize crawling behavior with advanced features like user agent rotation and pauses.

## Features

- **Customizable Crawling**: Supports different user agents and adjustable delays between requests.
- **Text-Only Crawling**: Extracts only textual content, including headings, paragraphs, and metadata.
- **Database Integration**: Stores crawled data in a structured format for future analysis and filtering.
- **Modern Stack**: Built using Puppeteer, Node.js, and React for frontend dashboard capabilities.
- **Stealth Mode**: Uses Puppeteer Extra Stealth Plugin to avoid detection.

## Getting Started

### Prerequisites

Make sure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [pnpm](https://pnpm.io/) (preferred package manager)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Ollie-nl/PagePolly.git
   cd PagePolly
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

## Usage

### Running the Crawler

Use the following command to start the crawler with a test URL:
```bash
pnpm run crawler
```

You can edit the crawling logic and the URL in `src/crawlers/testCrawler.js`.

### Configuration

Adjust the crawling behavior in `src/crawlers/`:
- **User Agents**: Configure different user agents for rotation.
- **Pauses**: Introduce delays between requests to avoid detection.
- **Text-Only Crawling**: Customize the logic to filter out non-textual content.

### Saving Data to Database

The crawler is designed to integrate with a database. Configure the database connection in `src/database/config.js` and use the provided utility functions to save crawled data.

## Roadmap

- Expand support for multiple crawling strategies (e.g., sitemap-based crawling).
- Create a React-based dashboard for visualizing and filtering crawled data.
- Implement advanced error handling and retry mechanisms.

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m "Add feature description"`
4. Push to the branch: `git push origin feature-name`
5. Create a pull request.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Happy Crawling! 🕷️