
import { Navigate } from "react-router-dom";

export const ProtectedRoutes = ({ children }) => {
  const isAuthenticated = localStorage.getItem("adminToken");
  return isAuthenticated ? children : <Navigate to="/admin" replace />;
};