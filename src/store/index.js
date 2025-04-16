import { configureStore } from '@reduxjs/toolkit';
import vendorReducer from './reducers/vendorSlice';
import crawlReducer from './reducers/crawlSlice';
import reportReducer from './reducers/reportSlice';
import settingReducer from './reducers/settingSlice';

const store = configureStore({
  reducer: {
    vendors: vendorReducer,
    crawls: crawlReducer,
    reports: reportReducer,
    settings: settingReducer
  },
});

export default store;