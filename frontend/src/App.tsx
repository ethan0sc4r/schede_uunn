// React import removed as it's not needed in React 17+
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import NavalUnits from './pages/NavalUnits';
import Groups from './pages/Groups';
import Templates from './pages/Templates';
import Search from './pages/Search';
import Admin from './pages/Admin';
import UnitView from './pages/UnitView';
import Quiz from './pages/Quiz';
import QuizHistory from './pages/QuizHistory';
import QuizTemplates from './pages/QuizTemplates';
import PublicQuiz from './pages/PublicQuiz';

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
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/units/:id/view" element={<UnitView />} />
              <Route path="/public/quiz/:token" element={<PublicQuiz />} />

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
                <Route path="templates" element={<Templates />} />
                <Route path="search" element={<Search />} />
                <Route path="quiz" element={<Quiz />} />
                <Route path="quiz/history" element={<QuizHistory />} />
                <Route path="quiz/templates" element={<QuizTemplates />} />
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
        </ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
