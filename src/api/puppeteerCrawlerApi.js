// src/api/puppeteerCrawlerApi.js
import supabaseClient from '../lib/supabaseClient';

/**
 * API wrapper voor de Puppeteer crawler endpoints
 */
class PuppeteerCrawlerAPI {
  
  /**
   * Initialiseert de API client met de juiste basis URL
   */
  constructor() {
    // Get the API base URL from environment variables or default to current host
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:4000' : '');
    
    // Specifiek pad voor puppeteer crawler endpoints
    this.apiBasePath = `${baseUrl}/api/crawls`;
    console.log('PuppeteerCrawlerAPI geïnitialiseerd met base path:', this.apiBasePath);
  }

  /**
   * Haal de authenticatieheader op met JWT token
   * @returns {Promise<Object>} - Headers object met autorisatie
   */
  async getAuthHeaders() {
    // Tijdelijk authenticatie overslaan voor ontwikkeling
    if (import.meta.env.DEV) {
      console.log('Ontwikkelingsmodus: authenticatie wordt overgeslagen');
      return {
        'Content-Type': 'application/json'
      };
    }

    const { data } = await supabaseClient.auth.getSession();
    const session = data.session;
    
    if (!session) {
      throw new Error('Gebruiker niet geauthenticeerd');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }

  /**
   * Start een nieuwe crawl job met de Puppeteer crawler
   * @param {string} vendorId - ID van de vendor setting
   * @param {Object} options - Optionele crawler instellingen
   * @returns {Promise<Object>} - Job creatie response met sessionId
   */
  async startCrawl(vendorId, options = {}) {
    try {
      const headers = await this.getAuthHeaders();
      
      if (!vendorId) {
        throw new Error('Vendor ID is vereist om een crawl te starten');
      }
      
      // Haal vendor URL uit de parameters of haal deze op uit de database
      let startUrls;
      if (options.startUrls && options.startUrls.length > 0) {
        startUrls = options.startUrls;
      } else {
        // Haal setting informatie op (met URL)
        const { data: vendor } = await supabaseClient
          .from('vendors_ohxp1d') // Gebruik de juiste tabelnaam
          .select('*')
          .eq('id', vendorId)
          .single();
        
        if (!vendor || !vendor.website) {
          throw new Error('Geen geldige vendor gevonden of vendor heeft geen URL');
        }
        
        startUrls = [vendor.website];
      }
      
      // Valideer elke URL en zorg ervoor dat deze geldig is
      startUrls = startUrls.map(url => {
        try {
          // Controleer of URL geldig is door URL object te maken
          let validatedUrl;
          try {
            // Probeer direct als URL (kan mislukken als het protocol ontbreekt)
            validatedUrl = new URL(url);
          } catch (e) {
            // Voeg protocol toe als dat ontbreekt
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
              validatedUrl = new URL('https://' + url);
            } else {
              throw e;
            }
          }
          
          // Zorg dat de URL eindigt met een slash als er geen pad is
          if (validatedUrl.pathname === '' || validatedUrl.pathname === '/') {
            validatedUrl.pathname = '/';
          }
          
          return validatedUrl.toString();
        } catch (e) {
          console.error(`Ongeldige URL: ${url}`, e);
          throw new Error(`De URL "${url}" is ongeldig: ${e.message}`);
        }
      });
      
      // Verwerk opties
      const { 
        maxDepth = 2, 
        maxPages = 50, 
        stealthMode = true,
        useProxy = false,
        waitTime = 2000,
        maxRetries = 3
      } = options;
      
      console.log(`Crawl starten voor vendorId ${vendorId} met startUrls:`, startUrls);
      
      const response = await fetch('/api/crawls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          vendorId,
          crawlerType: 'puppeteer',
          startUrls,
          maxDepth,
          maxPages,
          stealthMode,
          settings: {
            simulateHumanBehavior: stealthMode,
            useProxy,
            waitTime,
            maxRetries
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon crawl job niet starten');
      }

      return await response.json();
    } catch (error) {
      console.error('Fout bij starten van crawl:', error);
      throw error;
    }
  }

  /**
   * Haal de status van een crawl sessie op
   * @param {string} sessionId - ID van de crawl sessie
   * @returns {Promise<Object>} - Sessie status details
   */
  async getCrawlStatus(sessionId) {
    try {
      const headers = await this.getAuthHeaders();
      
      if (!sessionId) {
        throw new Error('Session ID is vereist om status op te halen');
      }
      
      console.log(`Status ophalen voor crawl sessie: ${sessionId}`);
      
      const response = await fetch(`/api/crawls/status`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon status niet ophalen');
      }

      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen van crawl status:', error);
      throw error;
    }
  }

  /**
   * Stop een lopende crawl sessie
   * @param {string} sessionId - ID van de crawl sessie
   * @returns {Promise<Object>} - Response met resultaat van de stop actie
   */
  async stopCrawl(sessionId) {
    try {
      const headers = await this.getAuthHeaders();
      
      if (!sessionId) {
        throw new Error('Session ID is vereist om crawl te stoppen');
      }
      
      console.log(`Stoppen van crawl sessie: ${sessionId}`);
      
      const response = await fetch(`/api/crawls/stop/${sessionId}`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Kon crawl sessie niet stoppen');
      }

      return await response.json();
    } catch (error) {
      console.error('Fout bij stoppen van crawl:', error);
      throw error;
    }
  }

  /**
   * Haal de resultaten op van een crawl sessie
   * @param {string} sessionId - ID van de crawl sessie
   * @returns {Promise<Object>} - Crawl resultaten
   */
  async getCrawlResults(sessionId) {
    // Deze functie gebruikt dezelfde endpoint als getCrawlStatus
    // want de status response bevat ook de resultaten
    return this.getCrawlStatus(sessionId);
  }

  /**
   * Haal crawl geschiedenis op voor een bepaalde vendor
   * @param {string} vendorId - ID van de vendor
   * @returns {Promise<Array>} - Lijst met crawl jobs voor de vendor
   */
  async getCrawlHistoryForVendor(vendorId) {
    try {
      const headers = await this.getAuthHeaders();
      const response = await fetch(`${this.apiBasePath}/crawl-history/${vendorId}`, {
        method: 'GET',
        headers
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Fout bij ophalen crawl geschiedenis:', error);
      throw error;
    }
  }

  /**
   * Haal alle actieve crawl jobs op met gedetailleerde informatie
   * @returns {Promise<Array>} - Lijst met actieve crawl jobs
   */
  async getActiveCrawls() {
    try {
      const headers = await this.getAuthHeaders();
      const url = `${this.apiBasePath}/active`;
      
      console.log('Ophalen actieve crawls van URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers
      });
      
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.warn(`HTTP error ${response.status} bij ophalen actieve crawls`);
        return []; // Retourneer een lege array bij HTTP errors
      }
      
      // Lees de response text en controleer of het geldige JSON is
      const text = await response.text();
      
      // Log de eerste 100 karakters van de response om te zien wat er terugkomt
      console.debug('Response eerste 100 karakters:', text.substring(0, 100));
      
      // Als de response begint met '<', dan is het waarschijnlijk HTML in plaats van JSON
      if (text.trim().startsWith('<')) {
        console.error('Response bevat HTML in plaats van JSON. Waarschijnlijk een server error.');
        return [];
      }
      
      let result;
      try {
        // Probeer de tekst te parsen als JSON
        result = text ? JSON.parse(text) : {};
        console.log('JSON response geparsed:', result);
        console.log('Response format check:', {
          isObject: typeof result === 'object',
          hasData: result && 'data' in result,
          dataIsArray: result && result.data && Array.isArray(result.data),
          resultIsArray: Array.isArray(result)
        });
      } catch (parseError) {
        console.error('Ongeldige JSON response van server:', parseError);
        console.debug('Ontvangen response tekst:', text);
        return []; // Retourneer een lege array bij JSON parse errors
      }
      
      // Controleer of de response het verwachte formaat heeft
      if (!result || typeof result !== 'object') {
        console.error('Ongeldig response formaat van server:', result);
        return [];
      }
      
      // Controleer of we een data array hebben of een andere structuur
      return Array.isArray(result.data) ? result.data : 
             (Array.isArray(result) ? result : []);
    } catch (error) {
      console.error('Fout bij ophalen actieve crawl jobs:', error);
      return []; // Return een lege array in geval van fouten om UI crashes te voorkomen
    }
  }
}

// Exporteer een singleton instance
export default new PuppeteerCrawlerAPI();