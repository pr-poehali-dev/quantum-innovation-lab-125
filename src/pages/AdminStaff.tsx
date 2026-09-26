import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const STAFF_AUTH_URL = "https://functions.poehali.dev/133aa768-2894-4ea6-bc35-3672a24c751d";

interface StaffRow {
  id: number;
  email: string;
  name: string;
  is_owner: boolean;
  active: boolean;
  created_at: string;
}

const AdminStaff = () => {
  const { token, staff: me } = useStaffAuth();
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3500);
  };

  const load = () => {
    setLoading(true);
    fetch(STAFF_AUTH_URL, { headers: { "X-Action": "list-staff", "X-Staff-Token": token || "" } })
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
        headers: { "Content-Type": "application/json", "X-Action": "create-invite", "X-Staff-Token": token || "" },
        body: JSON.stringify({ email: inviteEmail.trim() }),
      });
      const d = await r.json();
      if (r.ok) {
        setInviteLink(d.invite_link);
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
          <div className="flex gap-2">
            <input
              type="email"
              value={inviteEmail}
              onChange={e => setInviteEmail(e.target.value)}
              onKeyDown={e => e.key === "Enter" && invite()}
              className="flex-1 px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
              placeholder="colleague@example.com"
            />
            <button
              onClick={invite}
              disabled={inviting}
              className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60"
            >
              {inviting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="UserPlus" size={14} />}
              Пригласить
            </button>
          </div>

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
                <div key={s.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                      {s.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        {s.name}
                        {s.is_owner && (
                          <span className="text-[10px] font-mono bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-1.5 py-0.5">
                            владелец
                          </span>
                        )}
                        {me?.email === s.email && (
                          <span className="text-[10px] font-mono text-muted-foreground">(вы)</span>
                        )}
                      </p>
                      <p className="text-[12px] text-muted-foreground">{s.email}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${s.active ? "bg-green-500" : "bg-muted-foreground/30"}`} />
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
