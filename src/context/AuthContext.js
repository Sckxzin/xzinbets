import React, { createContext, useContext, useEffect, useState } from 'react';
import { getMe } from '../utils/api';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = () => getMe().then(setUser).catch(() => setUser(null));

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, []);

  const isAdmin = !!user?.is_admin;

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, refreshUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
