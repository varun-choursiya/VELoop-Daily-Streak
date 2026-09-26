import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import DailyStreakPage from "./pages/DailyStreak/DailyStreakPage.jsx";

function ProtectedRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return <div className="app-loader">Loading...</div>;
  }

  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/daily-streak"
            element={
              <ProtectedRoute>
                <DailyStreakPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/daily-streak" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
