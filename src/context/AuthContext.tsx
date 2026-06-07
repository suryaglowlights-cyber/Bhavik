import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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

  useEffect(() => {
    const saved = localStorage.getItem("bhavix_admin");
    if (saved) {
      const data = JSON.parse(saved);
      setIsLoggedIn(true);
      setAdminName(data.name || "Admin");
    }
  }, []);

  const login = (email: string, pass: string): boolean => {
    // Default admin credentials: admin@bhavix.com / admin123
    if (email === "admin@bhavix.com" && pass === "admin123") {
      const adminData = { email, name: "BhaviX Admin" };
      localStorage.setItem("bhavix_admin", JSON.stringify(adminData));
      setIsLoggedIn(true);
      setAdminName(adminData.name);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem("bhavix_admin");
    setIsLoggedIn(false);
    setAdminName("Admin");
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, adminName, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
