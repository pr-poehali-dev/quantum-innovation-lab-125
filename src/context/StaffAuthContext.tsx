import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const STAFF_AUTH_URL = "https://functions.poehali.dev/133aa768-2894-4ea6-bc35-3672a24c751d";
const STORAGE_KEY = "kk_staff_token";

export interface Staff {
  id: number;
  email: string;
  name: string;
  is_owner: boolean;
  role?: "owner" | "manager" | "support";
}

interface StaffAuthContextType {
  staff: Staff | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setSession: (token: string, staff: Staff) => void;
}

const StaffAuthContext = createContext<StaffAuthContextType>({
  staff: null,
  token: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  setSession: () => {},
});

export const useStaffAuth = () => useContext(StaffAuthContext);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) { setLoading(false); return; }
    fetch(STAFF_AUTH_URL, { headers: { "X-Action": "me", "X-Staff-Token": saved } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setStaff(d.staff); setToken(saved); })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoading(false));
  }, []);

  const setSession = (newToken: string, newStaff: Staff) => {
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
    setStaff(newStaff);
  };

  const login = async (email: string, password: string) => {
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "login" },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Ошибка входа" };
      setSession(d.token, { id: 0, email: d.email, name: d.name, is_owner: d.role === "owner", role: d.role });
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const logout = () => {
    if (token) {
      fetch(STAFF_AUTH_URL, { method: "POST", headers: { "X-Action": "logout", "X-Staff-Token": token } }).catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setStaff(null);
  };

  return (
    <StaffAuthContext.Provider value={{ staff, token, loading, login, logout, setSession }}>
      {children}
    </StaffAuthContext.Provider>
  );
};