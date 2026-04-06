import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import "./index.css";
import "./App.css";

// Pages
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import ContactPage from "./pages/ContactPage";
import UserDashboard from "./pages/UserDashboard";
import Login from "./pages/Login";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import CaseManagement from "./pages/CaseManagement";
import AdminRoute from "./components/AdminRoute";

function getToken() {
  return localStorage.getItem("token");
}

function decodeToken(token) {
  try {
    return JSON.parse(atob(token.split(".")[1]));
  } catch {
    return null;
  }
}

function DashboardRedirect() {
  const token = getToken();
  const user = decodeToken(token);

  if (!user) return <Navigate replace to="/login" />;
  return user.isAdmin ? (
    <Navigate replace to="/admin/dashboard" />
  ) : (
    <Navigate replace to="/user-dashboard" />
  );
}

function UserRoute({ children }) {
  const token = getToken();
  const user = decodeToken(token);

  if (!user) return <Navigate replace to="/login" />;
  if (user.isAdmin) return <Navigate replace to="/admin/dashboard" />;

  return children;
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/" element={<Navigate replace to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/contact" element={<ContactPage />} />

        {/* User */}
        <Route path="/user-dashboard" element={
          <UserRoute>
            <UserDashboard />
          </UserRoute>
        } />

        {/* Admin (Protected) */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/cases"
          element={
            <AdminRoute>
              <CaseManagement />
            </AdminRoute>
          }
        />

        {/* Fallback to login */}
        <Route path="*" element={<Navigate replace to="/login" />} />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}