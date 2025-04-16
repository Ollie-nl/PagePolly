import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

export const startCrawl = createAsyncThunk(
  'crawls/start',
  async (vendorId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/crawls', { vendorId });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to start crawl');
    }
  }
);

export const fetchCrawlStatus = createAsyncThunk(
  'crawls/fetchStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/crawls/status');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch crawl status');
    }
  }
);

export const fetchCrawlHistory = createAsyncThunk(
  'crawls/fetchHistory',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/crawls', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch crawl history');
    }
  }
);

export const cancelCrawl = createAsyncThunk(
  'crawls/cancel',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/api/crawls/${jobId}/cancel`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to cancel crawl job');
    }
  }
);

const initialState = {
  history: [],
  activeJobs: [],
  status: 'idle',
  error: null,
  progress: {},
  statistics: {}
};

const crawlSlice = createSlice({
  name: 'crawls',
  initialState,
  reducers: {
    updateProgress: (state, action) => {
      state.progress = {
        ...state.progress,
        ...action.payload
      };
    },
    clearCrawlError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Start crawl
      .addCase(startCrawl.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(startCrawl.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activeJobs.push(action.payload);
        // Initialize progress for this job
        state.progress[action.payload.id] = {
          percentage: 0,
          status: 'started'
        };
      })
      .addCase(startCrawl.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch crawl status
      .addCase(fetchCrawlStatus.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCrawlStatus.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.activeJobs = action.payload;
        
        // Update progress based on active jobs
        const progressUpdates = {};
        action.payload.forEach(job => {
          progressUpdates[job.id] = {
            percentage: job.progress || 0,
            status: job.status
          };
        });
        state.progress = {
          ...state.progress,
          ...progressUpdates
        };
      })
      .addCase(fetchCrawlStatus.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch crawl history
      .addCase(fetchCrawlHistory.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchCrawlHistory.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.history = action.payload;
      })
      .addCase(fetchCrawlHistory.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Cancel crawl
      .addCase(cancelCrawl.fulfilled, (state, action) => {
        const index = state.activeJobs.findIndex(job => job.id === action.payload.id);
        if (index !== -1) {
          state.activeJobs[index] = action.payload;
        }
        if (state.progress[action.payload.id]) {
          state.progress[action.payload.id].status = 'cancelled';
        }
      });
  }
});

export const { updateProgress, clearCrawlError } = crawlSlice.actions;

export default crawlSlice.reducer;