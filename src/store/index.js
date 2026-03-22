import { configureStore } from '@reduxjs/toolkit';
import vendorReducer from './reducers/vendorSlice';
import crawlReducer from './reducers/crawlSlice';
import reportReducer from './reducers/reportSlice';
const store = configureStore({
  reducer: {
    vendors: vendorReducer,
    crawls: crawlReducer,
    reports: reportReducer,
  },
});

export default store;