import React, { useContext, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { userContext } from '../context/UserLogin';

const ProtectedRoute = () => {
  const context = useContext(userContext);
  const { token, setToken,user } = context;


  useEffect(() => {
    // Sync token with localStorage
    const storedToken = localStorage.getItem('tracker-token-teacher');
    setToken(storedToken);
  }, [setToken]);

  // Redirect to login if no token
  return token ? <Outlet /> : <Navigate to="/login" replace />;
};


export default ProtectedRoute;