import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { Booking } from './pages/Booking';
import { Courts } from './pages/Courts';
import { Account } from './pages/Account';
import { Contact } from './pages/Contact';
import { FAQ } from './pages/FAQ';
import { Login, Register } from './pages/Auth';
import { Admin } from './pages/Admin';
import './App.css';

// User pages container with persistent navbar & footer
const UserLayout = () => {
  return (
    <div className="app">
      <Navbar />
      <Outlet />
      <Footer />
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* User facing pages */}
            <Route element={<UserLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/booking" element={<Booking />} />
              <Route path="/courts" element={<Courts />} />
              <Route path="/account" element={<Account />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Completely isolated admin portal */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin.html" element={<Admin />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
