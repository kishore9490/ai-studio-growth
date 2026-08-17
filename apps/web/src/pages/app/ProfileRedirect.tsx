import { Navigate } from 'react-router-dom';
import { usePlatform } from '../../platform/PlatformProvider';

/** "BID profile" in the sidebar resolves to this workspace's public profile. */
export function ProfileRedirect() {
  const { organization } = usePlatform();
  return <Navigate to={`/profile/${organization.bidId}`} replace />;
}
