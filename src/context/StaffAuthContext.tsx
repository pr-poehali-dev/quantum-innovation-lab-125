import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const STAFF_AUTH_URL = "https://functions.poehali.dev/133aa768-2894-4ea6-bc35-3672a24c751d";
const STORAGE_KEY = "kk_staff_token";
const PREVIEW_STORAGE_KEY = "kk_staff_preview_token";

export interface Staff {
  id: number;
  email: string;
  name: string;
  is_owner: boolean;
  role?: "owner" | "manager" | "support";
  is_preview?: boolean;
}

interface StaffAuthContextType {
  staff: Staff | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
  setSession: (token: string, staff: Staff) => void;
  startPreview: (role: "manager" | "support") => Promise<{ ok: boolean; error?: string; url?: string }>;
}

const StaffAuthContext = createContext<StaffAuthContextType>({
  staff: null,
  token: null,
  loading: true,
  login: async () => ({ ok: false }),
  logout: () => {},
  setSession: () => {},
  startPreview: async () => ({ ok: false }),
});

export const useStaffAuth = () => useContext(StaffAuthContext);

export const StaffAuthProvider = ({ children }: { children: ReactNode }) => {
  const [staff, setStaff] = useState<Staff | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPreviewTab, setIsPreviewTab] = useState(false);

  const fetchMe = (t: string) => {
    return fetch(STAFF_AUTH_URL, { headers: { "X-Action": "me", "X-Staff-Token": t } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setStaff(d.staff); setToken(t); return true; })
      .catch(() => false);
  };

  useEffect(() => {
    const init = async () => {
      // Вкладка быстрого просмотра: токен передан через URL ?preview_token=...
      const url = new URL(window.location.href);
      const urlPreviewToken = url.searchParams.get("preview_token");
      if (urlPreviewToken) {
        sessionStorage.setItem(PREVIEW_STORAGE_KEY, urlPreviewToken);
        url.searchParams.delete("preview_token");
        window.history.replaceState({}, "", url.pathname + url.search);
      }

      const previewSaved = sessionStorage.getItem(PREVIEW_STORAGE_KEY);
      if (previewSaved) {
        setIsPreviewTab(true);
        const ok = await fetchMe(previewSaved);
        if (!ok) sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
        setLoading(false);
        return;
      }

      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) { setLoading(false); return; }
      const ok = await fetchMe(saved);
      if (!ok) localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const startPreview = async (role: "manager" | "support") => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "preview-login", "X-Staff-Token": token },
        body: JSON.stringify({ role }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось открыть просмотр" };
      const url = `${window.location.origin}/admin?preview_token=${d.token}`;
      return { ok: true, url };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const logout = () => {
    if (token) {
      fetch(STAFF_AUTH_URL, { method: "POST", headers: { "X-Action": "logout", "X-Staff-Token": token } }).catch(() => {});
    }
    if (isPreviewTab) sessionStorage.removeItem(PREVIEW_STORAGE_KEY);
    else localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setStaff(null);
  };

  return (
    <StaffAuthContext.Provider value={{ staff, token, loading, login, logout, setSession, startPreview }}>
      {children}
    </StaffAuthContext.Provider>
  );
};
