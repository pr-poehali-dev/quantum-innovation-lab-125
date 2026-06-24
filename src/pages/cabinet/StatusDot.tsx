const StatusDot = ({ status }: { status: string }) => {
  const map: Record<string, string> = {
    done: "bg-green-500", production: "bg-amber-400 animate-pulse",
    approved: "bg-green-500", archived: "bg-border",
  };
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${map[status] ?? "bg-border"}`} />;
};

export default StatusDot;
