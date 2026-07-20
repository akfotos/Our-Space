import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import SetupCouple from './SetupCouple';

function PrivateRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const { coupleId, loading: coupleLoading } = useCouple();

  if (authLoading || coupleLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="text-rose-600">Loading...</span>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!coupleId) return <SetupCouple />;

  return children;
}

export default PrivateRoute;
