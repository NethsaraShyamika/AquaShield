import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import './index.css';
import AuthPage from './pages/AuthPage';
import AboutPage from './pages/AboutPage';
import ServicePage from './pages/ServicePage';
import ContactPage from './pages/ContactPage';
import UserDashboard from './pages/UserDashboard';
import { AnimatePresence } from "framer-motion";

// 👇 Separate component to use useLocation
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AuthPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/services" element={<ServicePage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/user-dashboard" element={<UserDashboard />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;