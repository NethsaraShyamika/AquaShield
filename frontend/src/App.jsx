import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import PageTransition from "./components/PageTransition";
import "leaflet/dist/leaflet.css";

import "./index.css";
import "./App.css";

// Pages
import AboutPage from "./pages/AboutPage";
import ServicePage from "./pages/ServicePage";
import ContactPage from "./pages/ContactPage";
import UserDashboard from "./pages/UserDashboard";
import MyReports from "./pages/MyReports";
import ReportForm from "./pages/ReportForm";
import AuthPage from "./pages/AuthPage";

// Admin
import AdminDashboard from "./pages/AdminDashboard";
import AdminSpeciesManagement from "./pages/AdminSpeciesManagement";
import CaseManagement from "./pages/CaseManagement";
import AdminReports from "./pages/AdminReports";
import ManageUsersDashboard from "./pages/ManageUsersDashboard"; // ✅ ADD THIS IMPORT
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
        <Route path="/" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/dashboard" element={<PageTransition><DashboardRedirect /></PageTransition>} />
        <Route path="/about" element={<PageTransition><AboutPage /></PageTransition>} />
        <Route path="/services" element={<PageTransition><ServicePage /></PageTransition>} />
        <Route path="/contact" element={<PageTransition><ContactPage /></PageTransition>} />

        {/* User */}
        <Route path="/user-dashboard" element={
          <UserRoute>
            <UserDashboard />
          </UserRoute>
        } />
        <Route path="/my-reports" element={
          <UserRoute>
            <MyReports />
          </UserRoute>
        } />
        <Route path="/report-form" element={
          <UserRoute>
            <ReportForm />
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

        {/* ✅ FIXED: Single User Management Route - PROPERLY PROTECTED */}
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <PageTransition>
                <ManageUsersDashboard />
              </PageTransition>
            </AdminRoute>
          }
        />

        <Route
          path="/admin/species"
          element={
            <AdminRoute>
              <AdminSpeciesManagement />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/reports"
          element={
            <AdminRoute>
              <AdminReports />
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