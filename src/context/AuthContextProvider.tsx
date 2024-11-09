import React, { createContext, useContext, useState, ReactNode } from 'react';

type Role = "User";

interface User {
    token: string;
    id: number;
    email: string;
    name: string;
    role: { id: number; name: Role };
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  isAuthenticated: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const user = localStorage.getItem('user')
    if(!user) return null

    return JSON.parse(user)
  });

  
  const login = (user: User) => {
    setUser(user);
    localStorage.setItem('token', user.token);
    localStorage.setItem('user', JSON.stringify(user))
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user')

  };

  const isAuthenticated = () => {
    return !!user;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};