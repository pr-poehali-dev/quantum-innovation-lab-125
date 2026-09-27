import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const CLIENT_AUTH_URL = "https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83";
const STORAGE_KEY = "kk_client_token";

export interface ClientDeal {
  id: number;
  brand: string | null;
  volume: number | null;
  amount: number | null;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  stage_order: number;
  created_at: string;
}

export interface ClientStage {
  id: number;
  name: string;
  sort_order: number;
  color: string;
}

export interface ClientProfile {
  id: number;
  name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  company: string | null;
}

interface ClientAuthContextType {
  client: ClientProfile | null;
  deals: ClientDeal[];
  stages: ClientStage[];
  loading: boolean;
  token: string | null;
  requestCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  createReorder: (data: { brand?: string; volume?: number; amount?: number }) => Promise<{ ok: boolean; error?: string; dealId?: number }>;
  logout: () => void;
  refresh: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  client: null,
  deals: [],
  stages: [],
  loading: true,
  token: null,
  requestCode: async () => ({ ok: false }),
  verifyCode: async () => ({ ok: false }),
  createReorder: async () => ({ ok: false }),
  logout: () => {},
  refresh: () => {},
});

export const useClientAuth = () => useContext(ClientAuthContext);

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [deals, setDeals] = useState<ClientDeal[]>([]);
  const [stages, setStages] = useState<ClientStage[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = (t: string) => {
    fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "me", "X-Client-Token": t } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { setClient(d.client); setDeals(d.deals || []); setStages(d.stages || []); setToken(t); })
      .catch(() => { localStorage.removeItem(STORAGE_KEY); setToken(null); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const url = new URL(window.location.href);
    const urlToken = url.searchParams.get("client_token");
    if (urlToken) {
      localStorage.setItem(STORAGE_KEY, urlToken);
      url.searchParams.delete("client_token");
      window.history.replaceState({}, "", url.pathname + url.search);
      fetchMe(urlToken);
      return;
    }
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) { setLoading(false); return; }
    fetchMe(saved);
  }, []);

  const requestCode = async (email: string) => {
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "request-code" },
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Ошибка" };
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const verifyCode = async (email: string, code: string) => {
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "verify-code" },
        body: JSON.stringify({ email, code }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Неверный код" };
      localStorage.setItem(STORAGE_KEY, d.token);
      setLoading(true);
      fetchMe(d.token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const createReorder = async (data: { brand?: string; volume?: number; amount?: number }) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-reorder", "X-Client-Token": token },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось создать заявку" };
      fetchMe(token);
      return { ok: true, dealId: d.deal_id };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setClient(null);
    setDeals([]);
  };

  const refresh = () => { if (token) fetchMe(token); };

  return (
    <ClientAuthContext.Provider value={{ client, deals, stages, loading, token, requestCode, verifyCode, createReorder, logout, refresh }}>
      {children}
    </ClientAuthContext.Provider>
  );
};