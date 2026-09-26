import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const LOGO_URL = "https://cdn.poehali.dev/projects/9054c912-be91-4f90-8cab-0a91d0d7eafe/bucket/9db39a90-e361-4243-b645-550db60b6f4c.png";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useStaffAuth();
  const navigate = useNavigate();

  const submit = async () => {
    if (!email.trim() || !password) { setError("Заполните email и пароль"); return; }
    setLoading(true);
    setError("");
    const res = await login(email.trim(), password);
    setLoading(false);
    if (res.ok) navigate("/admin");
    else setError(res.error || "Ошибка входа");
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
          <h1 className="font-serif text-xl font-bold mb-1">Вход в админку</h1>
          <p className="text-sm text-muted-foreground mb-6">Только для сотрудников по приглашению</p>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="you@kontraktkafe.ru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Пароль</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-sm text-destructive flex items-center gap-1.5">
                <Icon name="AlertCircle" size={14} />
                {error}
              </p>
            )}

            <button
              onClick={submit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 mt-2"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="LogIn" size={14} />}
              Войти
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Доступ выдаётся только по приглашению от владельца
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
