import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Accounts from './pages/Accounts';
import AccountDetail from './pages/AccountDetail';
import SettingsPage from './pages/SettingsPage';
import RecycleBin from './pages/RecycleBin';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  const token = localStorage.getItem('token');

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          
          {/* Protected Routes */}
          <Route path="/" element={token ? <Layout /> : <Navigate to="/login" />}>
            <Route index element={<Dashboard />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="recycle-bin" element={<RecycleBin />} />
          </Route>
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
