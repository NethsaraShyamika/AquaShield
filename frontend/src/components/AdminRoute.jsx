import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  // decode token to check isAdmin
  const payload = JSON.parse(atob(token.split(".")[1]));
  if (!payload.isAdmin) return <Navigate to="/" />;

  return children;
}