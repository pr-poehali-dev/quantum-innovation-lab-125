import Icon from "@/components/ui/icon";
import { getContactType, type ContactItem } from "@/lib/contactTypes";

interface Props {
  item: ContactItem;
  variant?: "icon" | "row";
}

const Glyph = ({ type, size = 16 }: { type: string; size?: number }) => {
  const def = getContactType(type);
  if (def.letter) {
    return <span className="font-bold leading-none" style={{ fontSize: size * 0.55 }}>{def.letter}</span>;
  }
  return <Icon name={def.icon} fallback="Link" size={size} />;
};

const ContactButton = ({ item, variant = "row" }: Props) => {
  const def = getContactType(item.type);
  const href = def.href(item.value.trim());
  const external = !/^(tel|mailto):/.test(href);
  const title = item.label || def.label;

  if (variant === "icon") {
    return (
      <a href={href} target={external ? "_blank" : undefined} rel="noopener noreferrer" title={title}
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-transform hover:scale-105 active:scale-95"
        style={{ background: def.color }}>
        <Glyph type={item.type} />
      </a>
    );
  }

  return (
    <a href={href} target={external ? "_blank" : undefined} rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/40 hover:bg-primary/5 transition-all group">
      <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white flex-shrink-0" style={{ background: def.color }}>
        <Glyph type={item.type} size={15} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-muted-foreground font-mono">{title.toUpperCase()}</span>
        <span className="block text-sm font-semibold truncate">{item.value}</span>
      </span>
      <Icon name="ArrowUpRight" size={14} className="text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
    </a>
  );
};

export { Glyph };
export default ContactButton;
