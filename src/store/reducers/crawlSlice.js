// src/store/reducers/crawlSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import puppeteerCrawlerApi from '../../api/puppeteerCrawlerApi';
import { toast } from 'react-hot-toast';

// Async thunks voor crawler operaties
export const startCrawl = createAsyncThunk(
  'crawl/startCrawl',
  async (crawlParams, { rejectWithValue }) => {
    try {
      console.log(`Start crawl met parameters:`, crawlParams);
      const { vendorId, startUrls, maxDepth, stealthMode, maxPages } = crawlParams;
      
      const response = await puppeteerCrawlerApi.startCrawl(vendorId, {
        maxDepth,
        maxPages,
        stealthMode
      });
      
      return response.data || response;
    } catch (error) {
      console.error('Fout bij starten crawl:', error);
      return rejectWithValue(error.message || 'Kon niet starten met crawlen');
    }
  }
);

export const fetchCrawlStatus = createAsyncThunk(
  'crawl/fetchCrawlStatus',
  async (sessionId, { rejectWithValue }) => {
    try {
      console.log(`Status ophalen voor sessie ID: ${sessionId}`);
      const response = await puppeteerCrawlerApi.getCrawlStatus(sessionId);
      return response.data || response;
    } catch (error) {
      console.error('Fout bij ophalen crawl status:', error);
      return rejectWithValue(error.message || 'Kon crawl status niet ophalen');
    }
  }
);

export const fetchCrawlResults = createAsyncThunk(
  'crawl/fetchCrawlResults',
  async (sessionId, { rejectWithValue }) => {
    try {
      console.log(`Resultaten ophalen voor sessie ID: ${sessionId}`);
      const response = await puppeteerCrawlerApi.getCrawlResults(sessionId);
      return response.data || response;
    } catch (error) {
      console.error('Fout bij ophalen crawl resultaten:', error);
      return rejectWithValue(error.message || 'Kon crawl resultaten niet ophalen');
    }
  }
);

export const stopCrawl = createAsyncThunk(
  'crawl/stopCrawl',
  async (sessionId, { rejectWithValue }) => {
    try {
      console.log(`Stop crawl voor sessie ID: ${sessionId}`);
      const response = await puppeteerCrawlerApi.stopCrawl(sessionId);
      return response;
    } catch (error) {
      console.error('Fout bij stoppen crawl:', error);
      return rejectWithValue(error.message || 'Kon crawl niet stoppen');
    }
  }
);

// Functie om crawl geschiedenis op te halen
export const getCrawlHistory = createAsyncThunk(
  'crawl/getCrawlHistory',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Ophalen crawl geschiedenis');
      // Hier zou je normaal de API aanroepen
      // Voor nu retourneren we een leeg array om de import error op te lossen
      return [];
    } catch (error) {
      console.error('Fout bij ophalen crawl geschiedenis:', error);
      return rejectWithValue(error.message || 'Kon crawl geschiedenis niet ophalen');
    }
  }
);

// Functie om actieve crawls op te halen
export const getActiveCrawls = createAsyncThunk(
  'crawl/getActiveCrawls',
  async (_, { rejectWithValue }) => {
    try {
      console.log('Ophalen actieve crawls via Redux thunk');
      // Gebruik de nieuwe API methode om actieve crawls op te halen
      const activeCrawls = await puppeteerCrawlerApi.getActiveCrawls();
      console.log('Actieve crawls opgehaald in thunk:', activeCrawls);
      
      // DEBUG: Voeg tijdelijke test crawl toe als er geen actieve crawls zijn
      if (Array.isArray(activeCrawls) && activeCrawls.length === 0) {
        console.log('GEEN ACTIEVE CRAWLS GEVONDEN, debuggen met test data');
        return [{
          sessionId: 'test-' + Date.now(),
          vendorId: 999,
          status: 'running',
          startUrls: ['https://testurl.com'],
          pagesCrawled: 5,
          maxPages: 50,
          currentDepth: 2,
          maxDepth: 5,
          progress: 35,
          recentUrls: ['https://testurl.com/page1', 'https://testurl.com/page2'],
          errors: 0,
          stats: {
            uniqueLinks: 15,
            internalLinks: 12,
            externalLinks: 3,
            averageProcessingTime: 450
          }
        }];
      }
      
      return activeCrawls;
    } catch (error) {
      console.error('Fout bij ophalen actieve crawls:', error);
      return rejectWithValue(error.message || 'Kon actieve crawls niet ophalen');
    }
  }
);

const initialState = {
  currentSession: null,
  crawlStatus: 'idle', // 'idle', 'running', 'completed', 'failed', 'cancelled'
  progress: 0,
  pagesCrawled: 0,
  currentDepth: 0,
  results: [],
  loading: false,
  error: null,
  successMessage: null,
  history: [],
  activeCrawls: []
};

const crawlSlice = createSlice({
  name: 'crawl',
  initialState,
  reducers: {
    clearCrawlState: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    resetCrawl: (state) => {
      return initialState; // Reset naar de default state
    },
    setCrawlHistory: (state, action) => {
      state.history = action.payload;
    },
    setActiveCrawls: (state, action) => {
      state.activeCrawls = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Start Crawl
      .addCase(startCrawl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startCrawl.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = {
          sessionId: action.payload.sessionId,
          startTime: new Date().toISOString()
        };
        state.crawlStatus = 'running';
        state.progress = 0;
        state.pagesCrawled = 0;
        state.results = [];
        toast.success('Crawl gestart');
      })
      .addCase(startCrawl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.crawlStatus = 'failed';
        toast.error(`Fout bij starten: ${action.payload}`);
      })

      // Fetch Crawl Status
      .addCase(fetchCrawlStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCrawlStatus.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update state met ontvangen status
        if (action.payload && action.payload.status) {
          state.crawlStatus = action.payload.status;
          state.progress = action.payload.progress || 0;
          state.pagesCrawled = action.payload.pagesCrawled || 0;
          state.currentDepth = action.payload.currentDepth || 0;
          
          // Als de crawl is voltooid, toon een melding
          if (action.payload.status === 'completed' && state.crawlStatus !== 'completed') {
            toast.success('Crawl voltooid!');
          } else if (action.payload.status === 'failed' && state.crawlStatus !== 'failed') {
            toast.error('Crawl mislukt');
          }
        }
      })
      .addCase(fetchCrawlStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Crawl Results
      .addCase(fetchCrawlResults.pending, (state) => {
        // Hier geen loading state zetten omdat dit vaak op de achtergrond wordt bijgewerkt
      })
      .addCase(fetchCrawlResults.fulfilled, (state, action) => {
        // Update alleen resultaten als er gegevens zijn
        if (action.payload && action.payload.results) {
          state.results = action.payload.results;
        }
      })
      .addCase(fetchCrawlResults.rejected, (state, action) => {
        state.error = action.payload;
        console.error('Fout bij ophalen resultaten:', action.payload);
      })

      // Stop Crawl
      .addCase(stopCrawl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(stopCrawl.fulfilled, (state) => {
        state.loading = false;
        state.crawlStatus = 'cancelled';
        toast.success('Crawl gestopt');
      })
      .addCase(stopCrawl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        toast.error(`Fout bij stoppen: ${action.payload}`);
      })

      // Get Crawl History
      .addCase(getCrawlHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCrawlHistory.fulfilled, (state, action) => {
        state.loading = false;
        state.history = action.payload;
      })
      .addCase(getCrawlHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get Active Crawls
      .addCase(getActiveCrawls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveCrawls.fulfilled, (state, action) => {
        state.loading = false;
        console.log('getActiveCrawls.fulfilled met payload:', action.payload);
        state.activeCrawls = action.payload;
        // Debug: controleer of de state correct is bijgewerkt
        console.log('Redux state na update:', state.activeCrawls);
      })
      .addCase(getActiveCrawls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCrawlState, resetCrawl, setCrawlHistory, setActiveCrawls } = crawlSlice.actions;
export default crawlSlice.reducer;