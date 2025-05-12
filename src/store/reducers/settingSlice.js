// src/store/reducers/settingSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import supabaseClient from '../../lib/supabaseClient';
import scrapingBeeService from '../../services/scrapingBeeService';

// Async thunks
export const fetchCrawlerConfigs = createAsyncThunk(
  'settings/fetchCrawlerConfigs',
  async (_, { rejectWithValue }) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const { data, error } = await supabaseClient
        .from('crawler_x65isd_configs')
        .select('*')
        .eq('user_email', session.user.email);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching crawler configs:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const saveCrawlerConfig = createAsyncThunk(
  'settings/saveCrawlerConfig',
  async (config, { rejectWithValue }) => {
    try {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        throw new Error('No active session');
      }

      const configData = {
        name: config.name,
        type: config.type,
        api_key: config.apiKey,
        api_endpoint: config.apiEndpoint,
        user_email: session.user.email,
        options: config.options || {}
      };

      let result;
      if (config.id) {
        const { data, error } = await supabaseClient
          .from('crawler_x65isd_configs')
          .update(configData)
          .eq('id', config.id)
          .select()
          .single();

        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabaseClient
          .from('crawler_x65isd_configs')
          .insert(configData)
          .select()
          .single();

        if (error) throw error;
        result = data;
      }

      return result;
    } catch (error) {
      console.error('Error saving crawler config:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const deleteCrawlerConfig = createAsyncThunk(
  'settings/deleteCrawlerConfig',
  async (id, { rejectWithValue }) => {
    try {
      const { error } = await supabaseClient
        .from('crawler_x65isd_configs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return id;
    } catch (error) {
      console.error('Error deleting crawler config:', error);
      return rejectWithValue(error.message);
    }
  }
);

export const testCrawlerConfig = createAsyncThunk(
  'settings/testCrawlerConfig',
  async (config, { rejectWithValue, signal }) => {
    try {
      // Ensure API key is present and clean it
      if (!config.apiKey) {
        throw new Error('API key is required for testing');
      }
      
      // Clean the API key by removing whitespace
      const cleanApiKey = config.apiKey.trim();
      
      if (!cleanApiKey) {
        throw new Error('API key cannot be empty');
      }
      
      console.log('Testing API connection with key (masked):', '****' + cleanApiKey.substring(cleanApiKey.length - 4));
      
      const result = await scrapingBeeService.testConnection(cleanApiKey);
      if (!result.success) {
        throw new Error(result.message);
      }
      return result;
    } catch (error) {
      console.error('Error testing crawler config:', error);
      return rejectWithValue(error.message);
    }
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    crawlers: [],
    activeConfig: null,
    status: 'idle',
    testStatus: 'idle',
    error: null,
    testError: null
  },
  reducers: {
    setActiveConfig: (state, action) => {
      state.activeConfig = action.payload;
    },
    clearTestStatus: (state) => {
      state.testStatus = 'idle';
      state.testError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch crawlers
      .addCase(fetchCrawlerConfigs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCrawlerConfigs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.crawlers = action.payload;
        state.error = null;
      })
      .addCase(fetchCrawlerConfigs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        toast.error(`Failed to load configurations: ${action.payload}`);
      })

      // Save crawler
      .addCase(saveCrawlerConfig.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(saveCrawlerConfig.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.crawlers.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.crawlers[index] = action.payload;
        } else {
          state.crawlers.push(action.payload);
        }
        toast.success('Configuration saved successfully');
      })
      .addCase(saveCrawlerConfig.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        toast.error(`Failed to save configuration: ${action.payload}`);
      })

      // Delete crawler
      .addCase(deleteCrawlerConfig.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteCrawlerConfig.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.crawlers = state.crawlers.filter(c => c.id !== action.payload);
        if (state.activeConfig?.id === action.payload) {
          state.activeConfig = null;
        }
        toast.success('Configuration deleted successfully');
      })
      .addCase(deleteCrawlerConfig.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
        toast.error(`Failed to delete configuration: ${action.payload}`);
      })

      // Test crawler
      .addCase(testCrawlerConfig.pending, (state) => {
        state.testStatus = 'loading';
        state.testError = null;
      })
      .addCase(testCrawlerConfig.fulfilled, (state, action) => {
        state.testStatus = 'succeeded';
        state.testError = null;
        toast.success(action.payload.message);
      })
      .addCase(testCrawlerConfig.rejected, (state, action) => {
        state.testStatus = 'failed';
        state.testError = action.payload;
        toast.error(`Test failed: ${action.payload}`);
      });
  }
});

export const { setActiveConfig, clearTestStatus } = settingsSlice.actions;
export default settingsSlice.reducer;