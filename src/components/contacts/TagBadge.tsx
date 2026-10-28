import { TAG_COLORS, type Tag } from "@/lib/contactsApi";

const TagBadge = ({ tag, onClick, active }: { tag: Tag; onClick?: () => void; active?: boolean }) => (
  <span onClick={onClick}
    className={`inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full ${TAG_COLORS[tag.color] || TAG_COLORS.gray} ${
      onClick ? "cursor-pointer" : ""} ${active ? "ring-2 ring-primary" : ""}`}>
    {tag.name}
  </span>
);

export default TagBadge;
