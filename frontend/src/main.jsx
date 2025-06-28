import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import './index.css';
import App from './App.jsx';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import CreateObject from './create-object';
import Navbar from './components/custom/Navbar';
import MyObjects from './my-objects';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />
  },
  {
    path: '/create-object',
    element: <CreateObject />
  },
  {
    path: '/my-object',
    element: <MyObjects />
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <RouterProvider router={router} />
    </ClerkProvider>
  </StrictMode>,
);