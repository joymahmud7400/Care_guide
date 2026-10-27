import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import LandingPage from './landing-page.jsx';
import '../styles.css';
import '../review.css';
import '../review-extra.css';
import './react.css';

const Page = window.location.pathname === '/app' || window.location.pathname.startsWith('/app/') ? App : LandingPage;
createRoot(document.getElementById('root')).render(<React.StrictMode><Page /></React.StrictMode>);
