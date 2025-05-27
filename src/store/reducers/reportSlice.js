import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

// Mock data voor rapporten wanneer API endpoint niet beschikbaar is
const mockReports = [];

export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      // Gebruik mock data in plaats van API call
      console.log('Mock rapporten ophalen met filters:', filters);
      return mockReports;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch reports');
    }
  }
);

export const fetchReport = createAsyncThunk(
  'reports/fetchOne',
  async (reportId, { rejectWithValue }) => {
    try {
      // Gebruik mock data in plaats van API call
      console.log('Mock rapport ophalen met ID:', reportId);
      const report = mockReports.find(r => r.id === reportId) || null;
      return report;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch report');
    }
  }
);

export const exportReport = createAsyncThunk(
  'reports/export',
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      // Simuleer een export actie zonder API call
      console.log(`Mock rapport exporteren naar ${format} formaat met filters:`, filters);
      
      // Toon een bericht dat export functionaliteit nog niet beschikbaar is
      alert('Export functionaliteit is nog in ontwikkeling.');
      
      return { success: true, format };
    } catch (error) {
      return rejectWithValue(error.response?.data || `Failed to export report as ${format}`);
    }
  }
);

const initialState = {
  items: [],
  current: null,
  filters: {},
  exportFormat: null,
  status: 'idle',
  error: null
};

const reportSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReportFilters: (state, action) => {
      state.filters = action.payload;
    },
    setExportFormat: (state, action) => {
      state.exportFormat = action.payload;
    },
    clearReportError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all reports
      .addCase(fetchReports.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Fetch single report
      .addCase(fetchReport.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.current = action.payload;
      })
      .addCase(fetchReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Export report
      .addCase(exportReport.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(exportReport.fulfilled, (state) => {
        state.status = 'succeeded';
      })
      .addCase(exportReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { setReportFilters, setExportFormat, clearReportError } = reportSlice.actions;

export default reportSlice.reducer;