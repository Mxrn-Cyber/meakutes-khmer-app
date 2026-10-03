import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Loading from "./Loading.jsx";

// Gates everything under /admin/*. Requires the "admin" or "editor" role,
// set via the admin Users page (or directly in MySQL for the first admin
// - see the backend README).
const AdminRoute = ({ children }) => {
  const { isEditor, isLoading, isAuthenticated } = useAuth();
  if (isLoading) return <Loading />;
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!isEditor) return <Navigate to="/" />;
  return children;
};

export default AdminRoute;
