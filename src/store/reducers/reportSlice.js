import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

export const fetchReports = createAsyncThunk(
  'reports/fetchAll',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/reports', { params: filters });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch reports');
    }
  }
);

export const fetchReport = createAsyncThunk(
  'reports/fetchOne',
  async (reportId, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/api/reports/${reportId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch report');
    }
  }
);

export const exportReport = createAsyncThunk(
  'reports/export',
  async ({ format, filters }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/reports/export', { format, filters }, {
        responseType: 'blob'
      });
      
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `report-${new Date().toISOString()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
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