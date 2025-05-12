// src/store/slices/crawlerSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import crawlerService from '../../services/crawlerService';

export const fetchCrawlerSettings = createAsyncThunk(
  'crawler/fetchSettings',
  async (vendorId) => {
    const settings = await crawlerService.getSettings(vendorId);
    return settings;
  }
);

export const setCrawlerSettings = createAsyncThunk(
  'crawler/setSettings',
  async (settings) => {
    const savedSettings = await crawlerService.saveSettings(settings);
    return savedSettings;
  }
);

export const startCrawl = createAsyncThunk(
  'crawler/startCrawl',
  async (settingsId) => {
    const crawlSession = await crawlerService.startCrawl(settingsId);
    return crawlSession;
  }
);

export const stopCrawl = createAsyncThunk(
  'crawler/stopCrawl',
  async (sessionId) => {
    await crawlerService.stopCrawl(sessionId);
    return sessionId;
  }
);

export const fetchCrawlResults = createAsyncThunk(
  'crawler/fetchResults',
  async (sessionId) => {
    const results = await crawlerService.getCrawlResults(sessionId);
    return results;
  }
);

const crawlerSlice = createSlice({
  name: 'crawler',
  initialState: {
    settings: null,
    isLoading: false,
    error: null,
    currentSession: null,
    crawlResults: [],
    crawlStatus: 'idle', // 'idle' | 'running' | 'completed' | 'failed'
  },
  reducers: {
    resetCrawlState: (state) => {
      state.crawlResults = [];
      state.crawlStatus = 'idle';
      state.currentSession = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Settings
      .addCase(fetchCrawlerSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCrawlerSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchCrawlerSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Set Settings
      .addCase(setCrawlerSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(setCrawlerSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(setCrawlerSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Start Crawl
      .addCase(startCrawl.pending, (state) => {
        state.crawlStatus = 'running';
        state.error = null;
      })
      .addCase(startCrawl.fulfilled, (state, action) => {
        state.currentSession = action.payload;
      })
      .addCase(startCrawl.rejected, (state, action) => {
        state.crawlStatus = 'failed';
        state.error = action.error.message;
      })
      // Stop Crawl
      .addCase(stopCrawl.fulfilled, (state) => {
        state.crawlStatus = 'completed';
      })
      // Fetch Results
      .addCase(fetchCrawlResults.fulfilled, (state, action) => {
        state.crawlResults = action.payload;
      });
  },
});

export const { resetCrawlState } = crawlerSlice.actions;
export default crawlerSlice.reducer;