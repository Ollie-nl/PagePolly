import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import store from './store';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Vendors from './pages/Vendors';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import CrawlerPage from './pages/crawler/CrawlerPage';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <Provider store={store}>
        <Router>
          <AuthProvider>
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="vendors" element={<Vendors />} />
              <Route path="reports" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
              <Route path="crawler/:projectId" element={<CrawlerPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            </Routes>
          <Toaster position="top-right" />
          </AuthProvider>
        </Router>
    </Provider>
  );
}

export default App;