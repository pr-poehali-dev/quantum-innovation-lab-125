import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const TG_URL = "https://functions.poehali.dev/bf331ea7-6409-4566-aa4f-7f10cc8180d3";

interface Status {
  configured: boolean;
  bot_username?: string;
  webhook?: boolean;
  linked?: boolean;
  tg_username?: string | null;
  subscribers?: number;
}

const TelegramSettings = ({ toast }: { toast: (msg: string, ok?: boolean) => void }) => {
  const { token } = useStaffAuth();
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const headers = { "X-Staff-Token": token || "" };

  const load = () =>
    fetch(TG_URL, { headers: { "X-Action": "status", ...headers } })
      .then(r => r.json()).then(setSt).catch(() => setSt({ configured: false }));

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const post = (action: string, body: unknown = {}) =>
    fetch(TG_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Action": action, ...headers }, body: JSON.stringify(body) })
      .then(async r => ({ ok: r.ok, d: await r.json() }));

  const connectWebhook = async () => {
    setBusy(true);
    const { ok, d } = await post("connect", { url: TG_URL });
    setBusy(false);
    if (ok && d.ok) { toast("Бот подключён ✓"); load(); } else toast(d.description || d.error || "Не удалось подключить", false);
  };

  const link = async () => {
    setBusy(true);
    const { ok, d } = await post("link-code");
    setBusy(false);
    if (ok) window.open(d.url, "_blank"); else toast(d.error || "Ошибка", false);
  };

  const unlink = async () => {
    await post("unlink");
    toast("Telegram отвязан");
    load();
  };

  return (
    <section>
      <h2 className="font-serif text-xl font-bold mb-1">Уведомления в Telegram</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Когда клиент или гость пишет в чат на сайте, бот присылает сообщение. Ответьте на него реплаем — ответ сразу появится у клиента на сайте.
      </p>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        {!st ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : !st.configured ? (
          <p className="text-sm">Токен бота не добавлен. Создайте бота у @BotFather в Telegram и добавьте токен в секреты проекта (TELEGRAM_BOT_TOKEN).</p>
        ) : (
          <>
            <div className="flex items-center gap-2 text-sm">
              <Icon name={st.webhook ? "CheckCircle2" : "AlertCircle"} size={16} className={st.webhook ? "text-green-600" : "text-amber-600"} />
              Бот @{st.bot_username}: {st.webhook ? "подключён к сайту" : "ещё не подключён к сайту"}
            </div>
            {!st.webhook && (
              <button onClick={connectWebhook} disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
                Подключить бота к сайту
              </button>
            )}
            {st.webhook && (
              <div className="flex flex-wrap items-center gap-3">
                {st.linked ? (
                  <>
                    <span className="text-sm text-green-700 flex items-center gap-1.5">
                      <Icon name="Check" size={14} /> Ваш Telegram подключён{st.tg_username ? ` (@${st.tg_username})` : ""}
                    </span>
                    <button onClick={unlink} className="text-[13px] text-muted-foreground hover:text-destructive">Отвязать</button>
                  </>
                ) : (
                  <button onClick={link} disabled={busy} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
                    <Icon name="Send" size={14} /> Подключить мой Telegram
                  </button>
                )}
                <span className="text-xs text-muted-foreground">Подключено менеджеров: {st.subscribers ?? 0}</span>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TelegramSettings;
