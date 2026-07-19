export function SportChip({
  emoji,
  label,
  active,
  onClick,
}: {
  emoji: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`shrink-0 px-5 py-3 rounded-full font-display font-bold whitespace-nowrap text-sm transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"
      }`}
    >
      <span className="ml-1">{emoji}</span>
      {label}
    </button>
  );
}