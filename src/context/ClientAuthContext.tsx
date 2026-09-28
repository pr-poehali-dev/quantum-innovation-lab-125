import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const CLIENT_AUTH_URL = "https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83";
const STORAGE_KEY = "kk_client_token";

export interface BatchOrder {
  id: number;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  stage_order: number;
  volume: number | null;
  amount: number | null;
  created_at: string;
  origin_id: number | null;
  origin_label: string | null;
  roast: string | null;
  packaging: string | null;
  weight_format: string | null;
  design: string | null;
  note: string | null;
}

export interface ProductBatch {
  id: number;
  name: string;
  created_at: string;
  orders: BatchOrder[];
}

export interface UnassignedOrder {
  id: number;
  brand: string | null;
  stage_id: number;
  stage_name: string;
  stage_color: string;
  stage_order: number;
  volume: number | null;
  amount: number | null;
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

export interface NewOrderParams {
  batch_id?: number;
  batch_name?: string;
  origin_id?: number;
  roast?: string;
  packaging?: string;
  weight_format?: string;
  design?: string;
  volume?: number;
  amount?: number;
  note?: string;
}

interface ClientAuthContextType {
  client: ClientProfile | null;
  batches: ProductBatch[];
  unassignedOrders: UnassignedOrder[];
  stages: ClientStage[];
  loading: boolean;
  token: string | null;
  requestCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  createOrder: (data: NewOrderParams) => Promise<{ ok: boolean; error?: string; dealId?: number; batchId?: number }>;
  logout: () => void;
  refresh: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  client: null,
  batches: [],
  unassignedOrders: [],
  stages: [],
  loading: true,
  token: null,
  requestCode: async () => ({ ok: false }),
  verifyCode: async () => ({ ok: false }),
  createOrder: async () => ({ ok: false }),
  logout: () => {},
  refresh: () => {},
});

export const useClientAuth = () => useContext(ClientAuthContext);

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [unassignedOrders, setUnassignedOrders] = useState<UnassignedOrder[]>([]);
  const [stages, setStages] = useState<ClientStage[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = (t: string) => {
    fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "me", "X-Client-Token": t } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setClient(d.client);
        setBatches(d.batches || []);
        setUnassignedOrders(d.unassigned_orders || []);
        setStages(d.stages || []);
        setToken(t);
      })
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

  const createOrder = async (data: NewOrderParams) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-order", "X-Client-Token": token },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось создать заказ" };
      fetchMe(token);
      return { ok: true, dealId: d.deal_id, batchId: d.batch_id };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setClient(null);
    setBatches([]);
    setUnassignedOrders([]);
  };

  const refresh = () => { if (token) fetchMe(token); };

  return (
    <ClientAuthContext.Provider value={{
      client, batches, unassignedOrders, stages, loading, token,
      requestCode, verifyCode, createOrder, logout, refresh,
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
};
