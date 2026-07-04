import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { permissions } = useAuth();

  return useMemo(() => {
    const set = new Set(permissions);
    return {
      can: (perm) => set.has(perm),
      canAny: (perms) => perms.some((p) => set.has(p)),
      canAll: (perms) => perms.every((p) => set.has(p)),
    };
  }, [permissions]);
}
