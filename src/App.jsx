import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Nav from './components/Nav';
import Auth from './components/Auth';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Player from './pages/Player';
import MemoryWall from './pages/MemoryWall';
import BucketList from './pages/BucketList';

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-1 p-4 sm:p-6">
          <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />
            <Route path="/watch" element={<PrivateRoute><Player /></PrivateRoute>} />
            <Route path="/memories" element={<PrivateRoute><MemoryWall /></PrivateRoute>} />
            <Route path="/bucket" element={<PrivateRoute><BucketList /></PrivateRoute>} />
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
}

export default App;
