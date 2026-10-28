import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import { useStaffAuth } from "@/context/StaffAuthContext";

const TG_URL = "https://functions.poehali.dev/bf331ea7-6409-4566-aa4f-7f10cc8180d3";

interface Sub { staff_id: number; name: string; tg_username: string | null }
interface Status {
  configured: boolean;
  bot_username?: string;
  webhook?: boolean;
  linked?: boolean;
  tg_username?: string | null;
  subscribers?: Sub[];
  can_manage?: boolean;
}

const TelegramSettings = ({ toast }: { toast: (msg: string, ok?: boolean) => void }) => {
  const { token } = useStaffAuth();
  const [st, setSt] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [botToken, setBotToken] = useState("");
  const headers = { "X-Staff-Token": token || "" };

  const load = () =>
    fetch(TG_URL, { headers: { "X-Action": "status", ...headers } })
      .then(r => r.json()).then(setSt).catch(() => setSt({ configured: false }));

  useEffect(() => { if (token) load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [token]);

  const post = (action: string, body: unknown = {}) =>
    fetch(TG_URL, { method: "POST", headers: { "Content-Type": "application/json", "X-Action": action, ...headers }, body: JSON.stringify(body) })
      .then(async r => ({ ok: r.ok, d: await r.json() }));

  const saveToken = async () => {
    setBusy(true);
    const { ok, d } = await post("save-token", { token: botToken, url: TG_URL });
    setBusy(false);
    if (ok) { setBotToken(""); toast("Бот подключён ✓"); load(); } else toast(d.error || "Не удалось подключить", false);
  };

  const disconnect = async () => {
    if (!confirm("Отключить бота? Уведомления у всех менеджеров перестанут приходить.")) return;
    await post("disconnect-bot");
    toast("Бот отключён");
    load();
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

  const inputCls = "w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:border-primary";

  return (
    <section>
      <h2 className="font-serif text-xl font-bold mb-1">Уведомления в Telegram</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Когда клиент или гость пишет в чат на сайте, бот присылает сообщение менеджеру. Ответьте на него реплаем — ответ сразу появится у клиента на сайте.
      </p>
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        {!st ? (
          <div className="flex justify-center py-4"><div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : (
          <>
            {!st.configured ? (
              st.can_manage ? (
                <div className="space-y-3">
                  <ol className="text-sm space-y-1 list-decimal pl-5 text-muted-foreground">
                    <li>В Telegram откройте <b className="text-foreground">@BotFather</b> и отправьте команду <b className="text-foreground">/newbot</b>.</li>
                    <li>Придумайте боту имя и адрес, BotFather пришлёт длинный токен.</li>
                    <li>Скопируйте токен и вставьте ниже.</li>
                  </ol>
                  <input className={inputCls} placeholder="Токен бота, например 123456789:AA..." value={botToken} onChange={e => setBotToken(e.target.value)} />
                  <button onClick={saveToken} disabled={busy || !botToken.trim()} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
                    {busy ? "Подключаю…" : "Подключить бота"}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Бот ещё не подключён. Попросите владельца добавить его в этом разделе.</p>
              )
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name={st.webhook ? "CheckCircle2" : "AlertCircle"} size={16} className={st.webhook ? "text-green-600" : "text-amber-600"} />
                    {st.bot_username ? `Бот @${st.bot_username}: ` : "Токен найден: "}{st.webhook ? "работает" : "ещё не подключён к сайту"}
                  </div>
                  {st.can_manage && <button onClick={disconnect} className="text-[13px] text-muted-foreground hover:text-destructive">Отключить бота</button>}
                </div>

                {!st.webhook && (
                  <button onClick={saveToken} disabled={busy} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40">
                    {busy ? "Подключаю…" : "Подключить бота к сайту"}
                  </button>
                )}

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
                </div>

                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-sm font-semibold">Кому приходят уведомления ({st.subscribers?.length ?? 0})</p>
                  {(st.subscribers || []).length === 0 && <p className="text-sm text-muted-foreground">Пока никто не подключён.</p>}
                  {(st.subscribers || []).map(s => (
                    <div key={s.staff_id} className="text-sm flex justify-between bg-secondary/40 rounded-lg px-3 py-2">
                      <span>{s.name}</span>
                      <span className="text-muted-foreground">{s.tg_username ? `@${s.tg_username}` : "Telegram"}</span>
                    </div>
                  ))}
                  <p className="text-xs text-muted-foreground pt-1">
                    Чтобы добавить коллегу: сначала пригласите его в админку (раздел «Команда»), затем он заходит в Настройки и нажимает «Подключить мой Telegram».
                  </p>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default TelegramSettings;
