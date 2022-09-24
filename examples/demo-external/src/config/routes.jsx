import React from 'react';
import { Navigate } from 'react-router-dom';
import Dashboard from '../views/Dashboard';
import Devices from '../views/Devices';
import NotFound from '../views/NotFound';
import Products from '../views/Products';

const routes = [
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />
  },
  {
    path: '/dashboard',
    element: <Dashboard />
  },
  {
    path: '/products',
    element: <Products />
  },
  {
    path: '/devices',
    element: <Devices />
  },
  {
    path: '*',
    element: <NotFound />
  }
];

export default routes;
