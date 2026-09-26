import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const STAFF_AUTH_URL = "https://functions.poehali.dev/133aa768-2894-4ea6-bc35-3672a24c751d";
const LOGO_URL = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";

const AdminJoin = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const navigate = useNavigate();
  const { setSession } = useStaffAuth();

  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) { setCheckError("Ссылка повреждена — отсутствует токен"); setChecking(false); return; }
    fetch(STAFF_AUTH_URL, { headers: { "X-Action": "check-invite", "X-Invite-Token": token } })
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw new Error(d.error || "Приглашение недействительно");
        setEmail(d.email);
      })
      .catch(e => setCheckError(e.message))
      .finally(() => setChecking(false));
  }, [token]);

  const submit = async () => {
    if (!name.trim()) { setFormError("Введите имя"); return; }
    if (password.length < 6) { setFormError("Пароль должен быть не короче 6 символов"); return; }
    if (password !== password2) { setFormError("Пароли не совпадают"); return; }

    setSubmitting(true);
    setFormError("");
    try {
      const r = await fetch(STAFF_AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Action": "accept-invite" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const d = await r.json();
      if (!r.ok) { setFormError(d.error || "Не удалось создать аккаунт"); setSubmitting(false); return; }
      setSession(d.token, { id: 0, email: d.email, name: d.name, is_owner: false });
      navigate("/admin");
    } catch {
      setFormError("Ошибка сети");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/">
            <img src={LOGO_URL} alt="КОНТРАКТ КОФЕ" className="h-9 w-auto object-contain" style={{ filter: "brightness(0)" }} />
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          {checking ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : checkError ? (
            <div className="text-center py-4">
              <Icon name="AlertCircle" size={28} className="text-destructive mx-auto mb-3" />
              <p className="text-sm font-medium">{checkError}</p>
              <p className="text-xs text-muted-foreground mt-2">Запросите новую ссылку у владельца админки</p>
            </div>
          ) : (
            <>
              <h1 className="font-serif text-xl font-bold mb-1">Добро пожаловать</h1>
              <p className="text-sm text-muted-foreground mb-6">
                Создайте пароль для <span className="font-medium text-foreground">{email}</span>
              </p>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Ваше имя</label>
                  <input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Пароль</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="Не короче 6 символов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Повторите пароль</label>
                  <input
                    type="password"
                    value={password2}
                    onChange={e => setPassword2(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && submit()}
                    className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                    placeholder="••••••••"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-destructive flex items-center gap-1.5">
                    <Icon name="AlertCircle" size={14} />
                    {formError}
                  </p>
                )}

                <button
                  onClick={submit}
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 mt-2"
                >
                  {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Check" size={14} />}
                  Создать аккаунт
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminJoin;
