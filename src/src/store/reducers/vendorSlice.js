import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';

export const fetchVendors = createAsyncThunk(
  'vendors/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/api/vendors');
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to fetch vendors');
    }
  }
);

export const addVendor = createAsyncThunk(
  'vendors/add',
  async (vendorData, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/api/vendors', vendorData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to add vendor');
    }
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/api/vendors/${id}`, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to update vendor');
    }
  }
);

export const deleteVendor = createAsyncThunk(
  'vendors/delete',
  async (id, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/api/vendors/${id}`);
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Failed to delete vendor');
    }
  }
);

const initialState = {
  items: [],
  status: 'idle',
  error: null,
  selectedVendor: null,
};

const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    selectVendor: (state, action) => {
      state.selectedVendor = state.items.find(vendor => vendor.id === action.payload) || null;
    },
    clearVendorError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch vendors
      .addCase(fetchVendors.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchVendors.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Add vendor
      .addCase(addVendor.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(addVendor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(addVendor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update vendor
      .addCase(updateVendor.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updateVendor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(vendor => vendor.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.selectedVendor?.id === action.payload.id) {
          state.selectedVendor = action.payload;
        }
      })
      .addCase(updateVendor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete vendor
      .addCase(deleteVendor.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deleteVendor.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(vendor => vendor.id !== action.payload);
        if (state.selectedVendor?.id === action.payload) {
          state.selectedVendor = null;
        }
      })
      .addCase(deleteVendor.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export const { selectVendor, clearVendorError } = vendorSlice.actions;

export default vendorSlice.reducer;