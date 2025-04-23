import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

export const fetchCrawlerConfigs = createAsyncThunk(
  'settings/fetchCrawlerConfigs',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/settings/crawlers');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch crawler configurations');
    }
  }
);

export const saveCrawlerConfig = createAsyncThunk(
  'settings/saveCrawlerConfig',
  async (config, { rejectWithValue }) => {
    try {
      const method = config.id ? 'put' : 'post';
      const url = config.id 
        ? `/api/settings/crawlers/${config.id}` 
        : '/api/settings/crawlers';
      
      const response = await apiClient[method](url, config);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to save crawler configuration');
    }
  }
);

export const deleteCrawlerConfig = createAsyncThunk(
  'settings/deleteCrawlerConfig',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/settings/crawlers/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete crawler configuration');
    }
  }
);

const initialState = {
  crawlers: [],
  preferences: {},
  status: 'idle',
  error: null
};

const settingSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updatePreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
    },
    clearSettingError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch crawler configs
      .addCase(fetchCrawlerConfigs.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCrawlerConfigs.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.crawlers = action.payload;
      })
      .addCase(fetchCrawlerConfigs.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Save crawler config
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
      })
      .addCase(saveCrawlerConfig.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete crawler config
      .addCase(deleteCrawlerConfig.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteCrawlerConfig.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.crawlers = state.crawlers.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCrawlerConfig.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { updatePreferences, clearSettingError } = settingSlice.actions;

export default settingSlice.reducer;