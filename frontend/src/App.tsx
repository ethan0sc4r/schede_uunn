import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Placeholder components - these will be implemented
const NavalUnits = () => <div className="p-6"><h1 className="text-2xl font-bold">Naval Units</h1><p>Naval units management coming soon...</p></div>;
const Groups = () => <div className="p-6"><h1 className="text-2xl font-bold">Groups</h1><p>Groups management coming soon...</p></div>;
const Search = () => <div className="p-6"><h1 className="text-2xl font-bold">Search</h1><p>Search functionality coming soon...</p></div>;
const Admin = () => <div className="p-6"><h1 className="text-2xl font-bold">Admin Panel</h1><p>Admin panel coming soon...</p></div>;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="units" element={<NavalUnits />} />
              <Route path="groups" element={<Groups />} />
              <Route path="search" element={<Search />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route path="" element={<Navigate to="/units" replace />} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
