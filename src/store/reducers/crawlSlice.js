// src/store/reducers/crawlSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  startCrawlJob,
  getCrawlJobDetails,
  getActiveCrawlJobs,
  getCrawlHistory as fetchCrawlHistory,
  cancelCrawlJob
} from '../../api/crawlerApi';

// Async thunks for crawler operations
export const startCrawl = createAsyncThunk(
  'crawl/startCrawl',
  async (data, { rejectWithValue }) => {
    try {
      const response = await startCrawlJob(data);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getCrawlDetails = createAsyncThunk(
  'crawl/getCrawlDetails',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await getCrawlJobDetails(jobId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getActiveCrawls = createAsyncThunk(
  'crawl/getActiveCrawls',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getActiveCrawlJobs();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const getCrawlHistory = createAsyncThunk(
  'crawl/getCrawlHistory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await fetchCrawlHistory(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const cancelCrawl = createAsyncThunk(
  'crawl/cancelCrawl',
  async (jobId, { rejectWithValue }) => {
    try {
      const response = await cancelCrawlJob(jobId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

const initialState = {
  activeJob: null,
  selectedJob: null,
  history: [],
  loading: false,
  error: null,
  successMessage: null
};

const crawlSlice = createSlice({
  name: 'crawl',
  initialState,
  reducers: {
    clearCrawlState: (state) => {
      state.error = null;
      state.successMessage = null;
    },
    clearActiveJob: (state) => {
      state.activeJob = null;
    },
    clearSelectedJob: (state) => {
      state.selectedJob = null;
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
        state.activeJob = action.payload;
        state.successMessage = 'Crawl job started successfully';
      })
      .addCase(startCrawl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to start crawl job';
      })

      // Get Crawl Details
      .addCase(getCrawlDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCrawlDetails.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the active job if the ID matches
        if (state.activeJob && state.activeJob.id === action.payload.id) {
          state.activeJob = action.payload;
          
          // If the job is completed, failed, or cancelled, remove it as active
          if (['completed', 'failed', 'cancelled'].includes(action.payload.status)) {
            setTimeout(() => {
              state.activeJob = null;
            }, 5000); // Keep the active job visible for 5 seconds before removing it
          }
        }
        
        // Set as selected job
        state.selectedJob = action.payload;
      })
      .addCase(getCrawlDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get crawl job details';
      })

      // Get Active Crawls
      .addCase(getActiveCrawls.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActiveCrawls.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.activeJob = action.payload[0]; // Get the most recent active job
        }
      })
      .addCase(getActiveCrawls.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to get active crawl jobs';
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
        state.error = action.payload?.message || 'Failed to get crawl history';
      })

      // Cancel Crawl
      .addCase(cancelCrawl.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelCrawl.fulfilled, (state, action) => {
        state.loading = false;
        
        // Update the active job if it exists and matches the cancelled job
        if (state.activeJob && state.activeJob.id === action.payload.id) {
          state.activeJob.status = 'cancelled';
          state.activeJob.completionTime = action.payload.completionTime;
          
          // Remove active job after a delay
          setTimeout(() => {
            state.activeJob = null;
          }, 5000);
        }
        
        // Update the selected job if it matches
        if (state.selectedJob && state.selectedJob.id === action.payload.id) {
          state.selectedJob.status = 'cancelled';
          state.selectedJob.completionTime = action.payload.completionTime;
        }
        
        state.successMessage = 'Crawl job cancelled successfully';
      })
      .addCase(cancelCrawl.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to cancel crawl job';
      });
  }
});

export const { clearCrawlState, clearActiveJob, clearSelectedJob } = crawlSlice.actions;
export default crawlSlice.reducer;