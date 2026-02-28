const COLORS = [
  '#84cc16', '#3b82f6', '#a855f7', '#eab308',
  '#ef4444', '#14b8a6', '#6366f1', '#f43f5e',
];

function hashName(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

interface AvatarProps {
  name: string;
  size?: number;
}

export default function Avatar({ name, size = 32 }: AvatarProps) {
  const color = COLORS[hashName(name) % COLORS.length];
  const initial = name.trim().charAt(0).toUpperCase();
  const fontSize = Math.round(size * 0.42);

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: `${color}25`,
        border: `1.5px solid ${color}50`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontSize,
        fontWeight: 700,
        color,
        userSelect: 'none',
      }}
    >
      {initial}
    </div>
  );
}
