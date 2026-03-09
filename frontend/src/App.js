import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllTickets from './pages/admin/AllTickets';
import AdminTicketDetail from './pages/admin/TicketDetail';
import AdminUsers from './pages/admin/Users';
import AdminPredictiveInsights from './pages/admin/PredictiveInsights';

// Agent Pages
import AgentDashboard from './pages/agent/AgentDashboard';
import AgentMyTickets from './pages/agent/MyTickets';
import AgentTicketDetail from './pages/agent/TicketDetail';

// User Pages
import UserDashboard from './pages/user/UserDashboard';
import UserMyTickets from './pages/user/MyTickets';
import UserCreateTicket from './pages/user/CreateTicket';
import UserTicketDetail from './pages/user/UserTicketDetail';

import LoadingSpinner from './components/LoadingSpinner';

// Route Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner message="Authenticating..." /></div>;

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to their own dashboard if role not allowed
        const dashboardMap = {
            admin: '/admin',
            agent: '/agent',
            user: '/user'
        };
        return <Navigate to={dashboardMap[user.role] || '/login'} replace />;
    }

    return children;
};

// Public Route Guard (prevents logged in users from seeing login/register)
const PublicRoute = ({ children }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LoadingSpinner message="Checking session..." /></div>;
    
    if (user) {
        const dashboardMap = { admin: '/admin', agent: '/agent', user: '/user' };
        return <Navigate to={dashboardMap[user.role] || '/user'} replace />;
    }
    
    return children;
};

function AppRoutes() {
    return (
        <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/tickets" element={<ProtectedRoute allowedRoles={['admin']}><AllTickets /></ProtectedRoute>} />
            <Route path="/admin/tickets/:id" element={<ProtectedRoute allowedRoles={['admin']}><AdminTicketDetail /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/predictive" element={<ProtectedRoute allowedRoles={['admin']}><AdminPredictiveInsights /></ProtectedRoute>} />

            {/* Agent Routes */}
            <Route path="/agent" element={<ProtectedRoute allowedRoles={['agent']}><AgentDashboard /></ProtectedRoute>} />
            <Route path="/agent/tickets" element={<ProtectedRoute allowedRoles={['agent']}><AgentMyTickets /></ProtectedRoute>} />
            <Route path="/agent/tickets/:id" element={<ProtectedRoute allowedRoles={['agent']}><AgentTicketDetail /></ProtectedRoute>} />

            {/* User Routes */}
            <Route path="/user" element={<ProtectedRoute allowedRoles={['user']}><UserDashboard /></ProtectedRoute>} />
            <Route path="/user/tickets" element={<ProtectedRoute allowedRoles={['user']}><UserMyTickets /></ProtectedRoute>} />
            <Route path="/user/tickets/:id" element={<ProtectedRoute allowedRoles={['user']}><UserTicketDetail /></ProtectedRoute>} />
            <Route path="/user/create-ticket" element={<ProtectedRoute allowedRoles={['user']}><UserCreateTicket /></ProtectedRoute>} />

            {/* Default Redirects */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </ToastProvider>
        </AuthProvider>
    );
}
