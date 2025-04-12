import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { userContext } from '../context/UserLogin';

const PublicRoute = () => {
  const context = useContext(userContext);
  const { token, setToken } = context;

  useEffect(() => {
    // Sync token with localStorage
    const storedToken = localStorage.getItem('tracker-token');
    setToken(storedToken);
  }, [setToken]);

  // Redirect to dashboard if token exists
  return token ? <Navigate to="/dashboard" replace /> : <Outlet />;
};
export default PublicRoute;