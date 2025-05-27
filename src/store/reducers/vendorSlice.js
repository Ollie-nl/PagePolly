import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import supabaseClient from '../../lib/supabaseClient';

// Functie om vendors uit de Supabase database te halen
const getVendorsFromDatabase = async () => {
  try {
    console.log('Vendors ophalen uit database...');
    const { data, error } = await supabaseClient
      .from('vendors_ohxp1d')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Fout bij ophalen vendors uit database:', error);
    throw error;
  }
};

export const fetchVendors = createAsyncThunk(
  'vendors/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const vendors = await getVendorsFromDatabase();
      return vendors;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch vendors');
    }
  }
);

export const addVendor = createAsyncThunk(
  'vendors/add',
  async (vendorData, { rejectWithValue }) => {
    try {
      console.log('Vendor toevoegen in database:', vendorData);
      
      const { data, error } = await supabaseClient
        .from('vendors_ohxp1d')
        .insert([vendorData])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to add vendor');
    }
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/update',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log(`Vendor ${id} bijwerken in database:`, data);
      
      const { data: updatedVendor, error } = await supabaseClient
        .from('vendors_ohxp1d')
        .update(data)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return updatedVendor;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update vendor');
    }
  }
);

export const deleteVendor = createAsyncThunk(
  'vendors/delete',
  async (id, { rejectWithValue }) => {
    try {
      console.log(`Vendor ${id} verwijderen uit database`);
      
      const { error } = await supabaseClient
        .from('vendors_ohxp1d')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete vendor');
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