import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import Icon from "@/components/ui/icon";
import { useClientAuth } from "@/context/ClientAuthContext";
import ConsentCheckbox, { useConsentEnabled } from "@/components/ConsentCheckbox";

const ClientLoginGate = ({ children }: { children: ReactNode }) => {
  const { client, loading, requestCode, verifyCode } = useClientAuth();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const consentEnabled = useConsentEnabled();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (client) return <>{children}</>;

  const submitEmail = async () => {
    if (!email.trim()) { setError("Введите email"); return; }
    if (consentEnabled && !agreed) { setError("Подтвердите согласие с условиями, чтобы получить код"); return; }
    setBusy(true);
    setError("");
    const res = await requestCode(email.trim());
    setBusy(false);
    if (res.ok) setStep("code");
    else setError(res.error || "Ошибка");
  };

  const submitCode = async () => {
    if (!code.trim()) { setError("Введите код из письма"); return; }
    setBusy(true);
    setError("");
    const res = await verifyCode(email.trim(), code.trim());
    setBusy(false);
    if (!res.ok) setError(res.error || "Неверный код");
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-8">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M3 7h8v3.5A3 3 0 0 1 8 13.5 3 3 0 0 1 3 10.5Z" fill="white" opacity="0.95"/>
                <path d="M11 8.5h1a1.5 1.5 0 0 1 0 3h-1" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
              </svg>
            </div>
            <span className="font-serif font-bold">КонтрактКофе</span>
          </Link>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6">
          <h1 className="font-serif text-xl font-bold mb-1">Личный кабинет</h1>

          {step === "email" ? (
            <>
              <p className="text-sm text-muted-foreground mb-6">Введите email, указанный при заказе — пришлём код входа</p>
              <div className="space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitEmail()}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:outline-none focus:border-primary transition-colors"
                  placeholder="you@company.ru"
                />
                <ConsentCheckbox checked={agreed} onChange={v => { setAgreed(v); setError(""); }} />
                {error && <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>}
                <button onClick={submitEmail} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60">
                  {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Mail" size={14} />}
                  Получить код
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-6">
                Код отправлен на <span className="font-medium text-foreground">{email}</span>
              </p>
              <div className="space-y-3">
                <input
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submitCode()}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm font-mono text-center tracking-widest focus:outline-none focus:border-primary transition-colors"
                  placeholder="000000"
                  maxLength={6}
                />
                {error && <p className="text-sm text-destructive flex items-center gap-1.5"><Icon name="AlertCircle" size={14} />{error}</p>}
                <button onClick={submitCode} disabled={busy}
                  className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60">
                  {busy ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Icon name="Check" size={14} />}
                  Войти
                </button>
                <button onClick={() => { setStep("email"); setCode(""); setError(""); }}
                  className="w-full text-[13px] text-muted-foreground hover:text-foreground transition-colors">
                  Изменить email
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientLoginGate;
