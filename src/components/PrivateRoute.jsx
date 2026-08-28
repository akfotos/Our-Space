import { useAuth } from '../contexts/AuthContext';
import { useCouple } from '../contexts/CoupleContext';
import SetupCouple from './SetupCouple';

function PrivateRoute({ children }) {
  const { user, loading: authLoading, error: authError } = useAuth();
  const { coupleId, loading: coupleLoading } = useCouple();

  if (authLoading || coupleLoading) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <span className="text-rose-600">Loading...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-8 text-center">
        <p className="max-w-md text-red-600">{authError || 'Could not open your space. Please refresh and try again.'}</p>
      </div>
    );
  }
  if (!coupleId) return <SetupCouple />;

  return children;
}

export default PrivateRoute;
