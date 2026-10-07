import { Link } from "react-router-dom";
import { useSection } from "@/lib/siteContent";

interface ConsentData {
  enabled: boolean;
  prefix: string;
  links: { label: string; slug: string }[];
  suffix: string;
}

export const DEFAULT_CONSENT: ConsentData = {
  enabled: true,
  prefix: "Я принимаю",
  links: [
    { label: "пользовательское соглашение", slug: "user-agreement" },
    { label: "политику конфиденциальности", slug: "privacy-policy" },
  ],
  suffix: "и даю согласие на обработку персональных данных",
};

interface Props {
  checked: boolean;
  onChange: (v: boolean) => void;
  invalid?: boolean;
}

export const useConsentEnabled = () => useSection<ConsentData>("consent", DEFAULT_CONSENT).enabled;

const ConsentCheckbox = ({ checked, onChange, invalid }: Props) => {
  const data = useSection<ConsentData>("consent", DEFAULT_CONSENT);
  if (!data.enabled) return null;

  return (
    <label className={`flex items-start gap-2.5 cursor-pointer select-none rounded-xl p-2.5 -mx-2.5 transition-colors ${invalid ? "bg-destructive/8" : ""}`}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-border accent-[hsl(var(--primary))] cursor-pointer" />
      <span className="text-[12px] leading-relaxed text-muted-foreground">
        {data.prefix}{" "}
        {data.links.map((l, i) => (
          <span key={l.slug}>
            <Link to={`/page/${l.slug}`} target="_blank" className="text-primary underline underline-offset-2 hover:text-primary/80">
              {l.label}
            </Link>
            {i < data.links.length - 2 ? ", " : i === data.links.length - 2 ? " и " : ""}
          </span>
        ))}
        {data.suffix ? ` ${data.suffix}` : ""}
      </span>
    </label>
  );
};

export default ConsentCheckbox;
