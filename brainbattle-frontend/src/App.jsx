import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import StudyCircle from './pages/StudyCircle';
import FunArena    from './pages/FunArena';
import QuizBattle  from './pages/QuizBattle';
import Profile     from './pages/Profile';

// Admin Pages
import AdminDashboard   from './pages/admin/AdminDashboard';
import QuestionManager  from './pages/admin/QuestionManager';
import UserManager      from './pages/admin/UserManager';

// Route guard
const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/dashboard" />;
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/"         element={<Landing />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/circle/:id"      element={<PrivateRoute><StudyCircle /></PrivateRoute>} />
          <Route path="/arena"           element={<PrivateRoute><FunArena /></PrivateRoute>} />
          <Route path="/quiz/:roomId"    element={<PrivateRoute><QuizBattle /></PrivateRoute>} />
          <Route path="/profile"         element={<PrivateRoute><Profile /></PrivateRoute>} />

          <Route path="/admin"           element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/questions" element={<AdminRoute><QuestionManager /></AdminRoute>} />
          <Route path="/admin/users"     element={<AdminRoute><UserManager /></AdminRoute>} />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
