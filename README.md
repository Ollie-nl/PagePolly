# PagePolly

PagePolly is een krachtige webscraper gebouwd met Next.js en Puppeteer. Het stelt je in staat om websites te crawlen en specifieke data te verzamelen, zoals paginatitels.

## Features
- Gebruiksvriendelijke API voor scraping
- Gebouwd met Next.js en Puppeteer
- JSON-uitvoer voor eenvoud in integratie
- Open-source en uitbreidbaar

## Getting Started

### Installatie
1. Clone de repository:
   ```bash
   git clone https://github.com/Ollie-nl/PagePolly.git
   cd PagePolly


Installeer de dependencies:

```bash
npm install
```

Start de development server:

```bash
npm run dev

```

##API Gebruiken

###Endpoint

GET /api/scrape?url=<website-url>

Voorbeeld:
GET http://localhost:3000/api/scrape?url=https://example.com

Respons JSON:
{
    "title": "Example Domain"
}

Contributing

Contributies zijn welkom! Maak een fork en stuur een pull request.


---

### **2. Een open-source licentie toevoegen**
Een licentie is belangrijk als je wilt dat anderen je project vrij kunnen gebruiken, aanpassen en delen.

#### **De juiste licentie kiezen**
De **MIT-licentie** is een van de meest gebruikte licenties voor open-source projecten. Het is eenvoudig en geeft anderen vrijheid, zolang ze je credits geven.

#### **Hoe toevoegen?**
1. Maak een bestand `LICENSE` aan in de root van je project:
   ```bash
   touch LICENSE
