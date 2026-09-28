import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

const CLIENT_AUTH_URL = "https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83";
const STORAGE_KEY = "kk_client_token";

export interface DealLot {
  id: number;
  lot_number: number;
  origin_id: number | null;
  origin_label: string | null;
  roast: string | null;
  packaging: string | null;
  weight_format: string | null;
  color: string | null;
  volume: number | null;
  amount: number | null;
  note: string | null;
}

export interface BatchDeal {
  id: number;
  stage_id: number | null;
  stage_name: string | null;
  stage_color: string | null;
  progress_percent: number | null;
  volume: number | null;
  amount: number | null;
  created_at: string;
  status: "draft" | "submitted";
  logistics_data: Record<string, string>;
  lots: DealLot[];
}

export interface ProductBatch {
  id: number;
  name: string;
  created_at: string;
  deals: BatchDeal[];
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

export interface ClientNotification {
  id: number;
  type: "stage_change" | "message";
  title: string;
  body: string;
  deal_id: number | null;
  is_read: boolean;
  created_at: string;
}

export interface LogisticsField {
  id: number;
  key: string;
  label: string;
  field_type: "text" | "textarea" | "phone" | "date";
  required: boolean;
  sort_order: number;
}

export interface LotInput {
  id?: number;
  deal_id?: number;
  origin_id?: number;
  roast?: string;
  packaging?: string;
  weight_format?: string;
  color?: string;
  volume?: number;
  amount?: number;
  note?: string;
}

interface ClientAuthContextType {
  client: ClientProfile | null;
  batches: ProductBatch[];
  stages: ClientStage[];
  loading: boolean;
  token: string | null;
  unreadNotifications: number;
  requestCode: (email: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (email: string, code: string) => Promise<{ ok: boolean; error?: string }>;
  createBatch: (name: string) => Promise<{ ok: boolean; error?: string; batchId?: number }>;
  createDraftDeal: (batchId: number) => Promise<{ ok: boolean; error?: string; dealId?: number }>;
  saveLot: (data: LotInput) => Promise<{ ok: boolean; error?: string; id?: number }>;
  deleteLot: (id: number) => Promise<{ ok: boolean; error?: string }>;
  updateLogistics: (dealId: number, data: Record<string, string>) => Promise<{ ok: boolean; error?: string }>;
  submitDeal: (dealId: number) => Promise<{ ok: boolean; error?: string }>;
  fetchLogisticsFields: () => Promise<LogisticsField[]>;
  fetchNotifications: () => Promise<ClientNotification[]>;
  markNotificationsRead: () => Promise<void>;
  logout: () => void;
  refresh: () => void;
}

const ClientAuthContext = createContext<ClientAuthContextType>({
  client: null,
  batches: [],
  stages: [],
  loading: true,
  token: null,
  unreadNotifications: 0,
  requestCode: async () => ({ ok: false }),
  verifyCode: async () => ({ ok: false }),
  createBatch: async () => ({ ok: false }),
  createDraftDeal: async () => ({ ok: false }),
  saveLot: async () => ({ ok: false }),
  deleteLot: async () => ({ ok: false }),
  updateLogistics: async () => ({ ok: false }),
  submitDeal: async () => ({ ok: false }),
  fetchLogisticsFields: async () => [],
  fetchNotifications: async () => [],
  markNotificationsRead: async () => {},
  logout: () => {},
  refresh: () => {},
});

export const useClientAuth = () => useContext(ClientAuthContext);

export const ClientAuthProvider = ({ children }: { children: ReactNode }) => {
  const [client, setClient] = useState<ClientProfile | null>(null);
  const [batches, setBatches] = useState<ProductBatch[]>([]);
  const [stages, setStages] = useState<ClientStage[]>([]);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchMe = (t: string) => {
    fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "me", "X-Client-Token": t } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => {
        setClient(d.client);
        setBatches(d.batches || []);
        setStages(d.stages || []);
        setUnreadNotifications(d.unread_notifications || 0);
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

  const createBatch = async (name: string) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-batch", "X-Client-Token": token },
        body: JSON.stringify({ name }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось создать партию" };
      fetchMe(token);
      return { ok: true, batchId: d.batch_id };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const createDraftDeal = async (batchId: number) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-draft-deal", "X-Client-Token": token },
        body: JSON.stringify({ batch_id: batchId }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось создать заказ" };
      fetchMe(token);
      return { ok: true, dealId: d.deal_id };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const saveLot = async (data: LotInput) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "save-lot", "X-Client-Token": token },
        body: JSON.stringify(data),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось сохранить лот" };
      fetchMe(token);
      return { ok: true, id: d.id };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const deleteLot = async (id: number) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "delete-lot", "X-Client-Token": token },
        body: JSON.stringify({ id }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось удалить лот" };
      fetchMe(token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const updateLogistics = async (dealId: number, data: Record<string, string>) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-logistics", "X-Client-Token": token },
        body: JSON.stringify({ deal_id: dealId, logistics_data: data }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось сохранить логистику" };
      fetchMe(token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const submitDeal = async (dealId: number) => {
    if (!token) return { ok: false, error: "Не авторизован" };
    try {
      const r = await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "submit-deal", "X-Client-Token": token },
        body: JSON.stringify({ deal_id: dealId }),
      });
      const d = await r.json();
      if (!r.ok) return { ok: false, error: d.error || "Не удалось отправить на согласование" };
      fetchMe(token);
      return { ok: true };
    } catch {
      return { ok: false, error: "Ошибка сети" };
    }
  };

  const fetchLogisticsFields = async (): Promise<LogisticsField[]> => {
    try {
      const r = await fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "list-logistics-fields" } });
      const d = await r.json();
      return d.fields || [];
    } catch {
      return [];
    }
  };

  const fetchNotifications = async (): Promise<ClientNotification[]> => {
    if (!token) return [];
    try {
      const r = await fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "list-notifications", "X-Client-Token": token } });
      const d = await r.json();
      return d.notifications || [];
    } catch {
      return [];
    }
  };

  const markNotificationsRead = async () => {
    if (!token) return;
    try {
      await fetch(CLIENT_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "mark-notifications-read", "X-Client-Token": token },
      });
      setUnreadNotifications(0);
    } catch { /* ignore */ }
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
    setClient(null);
    setBatches([]);
  };

  const refresh = () => { if (token) fetchMe(token); };

  return (
    <ClientAuthContext.Provider value={{
      client, batches, stages, loading, token, unreadNotifications,
      requestCode, verifyCode, createBatch, createDraftDeal, saveLot, deleteLot,
      updateLogistics, submitDeal, fetchLogisticsFields, fetchNotifications, markNotificationsRead,
      logout, refresh,
    }}>
      {children}
    </ClientAuthContext.Provider>
  );
};
