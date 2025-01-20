
# PagePolly EN

PagePolly is a powerful and extensible web crawler built using Puppeteer, Node.js, and PostgreSQL. It enables you to crawl websites for text-based content, save results in a structured database, and visualize data with a React-based dashboard.

---

## Features

- **Customizable Crawling**: User-agent rotation, delays, and stealth mode.
- **Text-Only Crawling**: Extracts headings, paragraphs, and metadata.
- **Database Integration**: Uses PostgreSQL for structured storage.
- **Modern Stack**: Puppeteer, Node.js, React.
- **Stealth Mode**: Avoids detection using Puppeteer Extra Stealth Plugin.

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

---

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

3. Start the backend server with Docker:
   ```bash
   docker-compose up -d
   ```

4. Run the development server:
   ```bash
   pnpm start
   ```

---

## Usage

### Running the Crawler

- To start crawling:
  ```bash
  pnpm run server
  ```
- Enter the target URL and depth in the frontend form.

---

## Roadmap

- Expand crawling strategies.
- Add proxy support.
- React dashboard for visualization.
- Distributed crawling.

---

## Contributing

Contributions are welcome!

1. Fork the repository.
2. Create a branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit your changes:
   ```bash
   git commit -m "Add feature description"
   ```
4. Push to the branch:
   ```bash
   git push origin feature-name
   ```

---

## License

This project is licensed under the MIT License.

---

Happy Crawling! 🕷️



# PagePolly NL

PagePolly is een krachtige en uitbreidbare webcrawler gebouwd met Puppeteer, Node.js en PostgreSQL. Het stelt je in staat om websites te crawlen naar tekstuele inhoud, resultaten op te slaan in een gestructureerde database, en data te visualiseren via een React-dashboard.

---

## Functionaliteiten

- **Aanpasbare Crawling**: User-agentrotatie, vertragingen, en stealth-modus.
- **Alleen Tekst Crawlen**: Headings, paragrafen en metadata.
- **Database-integratie**: Gebruik van PostgreSQL voor gestructureerde opslag.
- **Moderne Technologieën**: Puppeteer, Node.js, React.
- **Stealth-modus**: Verminder detectie met Puppeteer Extra Stealth Plugin.

---

## Aan de Slag

### Vereisten

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/)

---

### Installatie

1. Clone de repository:
   ```bash
   git clone https://github.com/Ollie-nl/PagePolly.git
   cd PagePolly
   ```

2. Installeer afhankelijkheden:
   ```bash
   pnpm install
   ```

3. Start de backendserver met Docker:
   ```bash
   docker-compose up -d
   ```

4. Start de ontwikkelserver:
   ```bash
   pnpm start
   ```

---

## Gebruik

### De Crawler Starten

- Start de crawler:
  ```bash
  pnpm run server
  ```
- Vul de doel-URL en diepte in via het frontendformulier.

---

## Roadmap

- Crawling-strategieën uitbreiden.
- Proxy-ondersteuning toevoegen.
- React-dashboard voor visualisatie.
- Gedistribueerd crawlen.

---

## Bijdragen

Bijdragen zijn welkom!

1. Fork de repository.
2. Maak een branch:
   ```bash
   git checkout -b feature-name
   ```
3. Commit je wijzigingen:
   ```bash
   git commit -m "Beschrijving van de wijziging"
   ```
4. Push naar de branch:
   ```bash
   git push origin feature-name
   ```

---

## Licentie

Dit project valt onder de MIT-licentie.

---

Veel Crawl-plezier! 🕷️
