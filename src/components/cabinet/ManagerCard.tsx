import { useEffect, useState } from "react";
import Icon from "@/components/ui/icon";
import ContactButton from "@/components/ContactButton";
import { initialsOf, type ContactItem } from "@/lib/contactTypes";
import { useClientAuth } from "@/context/ClientAuthContext";

const CLIENT_AUTH_URL = "https://functions.poehali.dev/6de59166-2dc1-44b2-831e-bc348d5c3c83";

interface Manager {
  id: number;
  name: string;
  position: string;
  description: string;
  photo_url: string;
  contacts: ContactItem[];
}

interface Props {
  staffId: number;
  fallbackName?: string | null;
  onClose: () => void;
  onWrite?: () => void;
}

const ManagerCard = ({ staffId, fallbackName, onClose, onWrite }: Props) => {
  const { token } = useClientAuth();
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(CLIENT_AUTH_URL, { headers: { "X-Action": "get-manager", "X-Client-Token": token, "X-Staff-Id": String(staffId) } })
      .then(r => r.json())
      .then(d => setManager(d.manager || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, staffId]);

  const name = manager?.name || fallbackName || "Менеджер";

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-sm bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-200">
        <button onClick={onClose} aria-label="Закрыть"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-secondary/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-10">
          <Icon name="X" size={15} />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="p-6 pb-8">
            <div className="flex flex-col items-center text-center mb-5">
              {manager?.photo_url ? (
                <img src={manager.photo_url} alt={name} className="w-24 h-24 rounded-full object-cover border-4 border-card shadow-md mb-3" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-foreground text-background flex items-center justify-center text-2xl font-bold mb-3 shadow-md">
                  {initialsOf(name)}
                </div>
              )}
              <p className="font-serif text-xl font-bold">{name}</p>
              <p className="text-sm text-primary font-medium mt-0.5">{manager?.position || "Персональный менеджер"}</p>
              {manager?.description && (
                <p className="text-[13px] text-muted-foreground leading-relaxed mt-3 whitespace-pre-line">{manager.description}</p>
              )}
            </div>

            {manager && manager.contacts.length > 0 && (
              <div className="space-y-2 mb-4">
                {manager.contacts.map((c, i) => <ContactButton key={i} item={c} />)}
              </div>
            )}

            {onWrite && (
              <button onClick={() => { onClose(); onWrite(); }}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all active:scale-95">
                <Icon name="MessageCircle" size={15} /> Написать в чате на сайте
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManagerCard;
