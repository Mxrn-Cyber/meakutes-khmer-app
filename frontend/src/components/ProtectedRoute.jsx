import { Navigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import Loading from "./Loading.jsx";

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return <Loading />;
  return isAuthenticated ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
