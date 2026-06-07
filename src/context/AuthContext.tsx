import { createContext, useContext, useState, type ReactNode } from "react";

interface AuthContextType {
  isLoggedIn: boolean;
  adminName: string;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminName, setAdminName] = useState("Admin");


  const login = (email: string, pass: string): boolean => {
    // Default admin credentials: admin@bhavik.com / admin123
    if (email === "admin@bhavik.com" && pass === "admin123") {
      const adminData = { email, name: "Bhavik Admin" };
      setIsLoggedIn(true);
      setAdminName(adminData.name);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setAdminName("Admin");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, adminName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
