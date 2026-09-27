import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const STAFF_AUTH_URL = "https://functions.poehali.dev/133aa768-2894-4ea6-bc35-3672a24c751d";

type Role = "owner" | "manager" | "support";

interface StaffRow {
  id: number;
  email: string;
  name: string;
  is_owner: boolean;
  active: boolean;
  created_at: string;
  role: Role;
}

const ROLE_LABELS: Record<Role, string> = {
  owner: "Владелец",
  manager: "Менеджер",
  support: "Поддержка",
};

const AdminStaff = () => {
  const { token, staff: me } = useStaffAuth();
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"manager" | "support">("manager");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const isOwner = me?.role === "owner" || me?.is_owner;

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const authHeaders = { "X-Staff-Token": token || "" };

  const load = () => {
    setLoading(true);
    fetch(STAFF_AUTH_URL, { headers: { "X-Action": "list-staff", ...authHeaders } })
      .then(r => r.json())
      .then(d => setStaffList(d.staff || []))
      .catch(() => showToast("Ошибка загрузки", false))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (token) load(); }, [token]);

  const invite = async () => {
    if (!inviteEmail.trim()) { showToast("Введите email", false); return; }
    setInviting(true);
    setInviteLink("");
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "create-invite", ...authHeaders },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });
      const d = await r.json();
      if (r.ok) {
        const path = d.invite_path || d.invite_link;
        setInviteLink(`${window.location.origin}${path}`);
        setInviteEmail("");
        showToast("Приглашение создано ✓");
      } else showToast(d.error || "Ошибка", false);
    } catch { showToast("Ошибка сети", false); }
    finally { setInviting(false); }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    showToast("Ссылка скопирована ✓");
  };

  const changeRole = async (staffId: number, role: "manager" | "support") => {
    setStaffList(prev => prev.map(s => s.id === staffId ? { ...s, role } : s));
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "update-role", ...authHeaders },
        body: JSON.stringify({ staff_id: staffId, role }),
      });
      if (r.ok) showToast("Роль обновлена ✓");
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); load(); }
    } catch { showToast("Ошибка сети", false); load(); }
  };

  const toggleActive = async (staffRow: StaffRow) => {
    const newActive = !staffRow.active;
    setStaffList(prev => prev.map(s => s.id === staffRow.id ? { ...s, active: newActive } : s));
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "set-active", ...authHeaders },
        body: JSON.stringify({ staff_id: staffRow.id, active: newActive }),
      });
      if (r.ok) showToast(newActive ? "Доступ включён ✓" : "Доступ отключён");
      else { const d = await r.json(); showToast(d.error || "Ошибка", false); load(); }
    } catch { showToast("Ошибка сети", false); load(); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-white border-b border-border">
        <div className="max-w-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
              <Icon name="ArrowLeft" size={16} />
            </Link>
            <div className="w-px h-5 bg-border" />
            <div className="flex items-center gap-2">
              <Icon name="Users" size={16} className="text-primary" />
              <span className="font-semibold text-sm">Сотрудники</span>
            </div>
          </div>
        </div>
      </header>

      {toast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg text-sm font-medium ${
          toast.ok ? "bg-green-500 text-white" : "bg-destructive text-white"
        }`}>
          <Icon name={toast.ok ? "Check" : "X"} size={14} />
          {toast.msg}
        </div>
      )}

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">

        {/* Приглашение */}
        <section className="bg-card border border-border rounded-2xl p-5">
          <h2 className="font-serif text-lg font-bold mb-1">Пригласить коллегу</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Создайте ссылку-приглашение и отправьте её коллеге в Telegram или почте
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && invite()}
              className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="colleague@example.com"
            />
            <select
              value={inviteRole}
              onChange={e => setInviteRole(e.target.value as "manager" | "support")}
              className="px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors bg-white"
            >
              <option value="manager">Менеджер</option>
              <option value="support">Поддержка</option>
            </select>
            <button
              onClick={invite}
              disabled={inviting}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
            >
              {inviting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="UserPlus" size={14} />}
              Пригласить
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Поддержка отвечает на входящие обращения в чате первой; менеджер ведёт закреплённые сделки
          </p>

          {inviteLink && (
            <div className="mt-4 bg-primary/5 border border-primary/20 rounded-xl p-3 flex items-center gap-2">
              <input readOnly value={inviteLink} className="flex-1 bg-transparent text-[13px] font-mono text-primary outline-none" />
              <button onClick={copyLink} className="text-primary hover:text-primary/70 transition-colors flex-shrink-0">
                <Icon name="Copy" size={15} />
              </button>
            </div>
          )}
        </section>

        {/* Список сотрудников */}
        <section>
          <h2 className="font-serif text-lg font-bold mb-4">Все сотрудники</h2>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {staffList.map(s => (
                <div key={s.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium flex items-center gap-2 flex-wrap">
                        {s.name}
                        {s.is_owner ? (
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                            владелец
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono bg-secondary text-muted-foreground border border-border rounded-full px-1.5 py-0.5">
                            {ROLE_LABELS[s.role]}
                          </span>
                        )}
                        {me?.email === s.email && (
                          <span className="text-[10px] font-mono text-muted-foreground">(вы)</span>
                        )}
                      </p>
                      <p className="text-[12px] text-muted-foreground truncate">{s.email}</p>
                    </div>
                  </div>

                  {isOwner && !s.is_owner && me?.email !== s.email ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <select
                        value={s.role}
                        onChange={e => changeRole(s.id, e.target.value as "manager" | "support")}
                        className="text-[12px] border border-border rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:border-primary transition-colors"
                      >
                        <option value="manager">Менеджер</option>
                        <option value="support">Поддержка</option>
                      </select>
                      <button onClick={() => toggleActive(s)}
                        className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors ${
                          s.active
                            ? "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                            : "border-green-200 text-green-600 bg-green-50"
                        }`}>
                        {s.active ? "Отключить" : "Включить"}
                      </button>
                    </div>
                  ) : (
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default AdminStaff;
