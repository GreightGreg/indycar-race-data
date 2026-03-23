export const CAR_COLORS: Record<string, string> = {
  '2':  '#FFFFFF',
  '3':  '#FFFFFF',
  '4':  '#FFFFFF',
  '5':  '#000000',
  '6':  '#000000',
  '7':  '#000000',
  '8':  '#004c8f',
  '9':  '#eb6822',
  '10': '#b90f31',
  '12': '#eeee54',
  '14': '#FFFFFF',
  '15': '#FFFFFF',
  '18': '#000000',
  '19': '#000000',
  '20': '#bcd3d7',
  '21': '#bcd3d7',
  '26': '#000000',
  '27': '#000000',
  '28': '#000000',
  '45': '#FFFFFF',
  '47': '#000000',
  '60': '#000000',
  '66': '#000000',
  '76': '#000000',
  '77': '#022f5b',
};

const DARK_COLORS = new Set(['#000000', '#004c8f', '#022f5b']);

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface CarBadgeProps {
  num: string;
  size?: 'sm' | 'md' | 'lg';
}

const CarBadge = ({ num, size = 'md' }: CarBadgeProps) => {
  const bg = CAR_COLORS[num];
  const dim = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-16 h-16' : 'w-8 h-8';
  const imgSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-12 h-12' : 'w-6 h-6';
  const isDark = !bg || DARK_COLORS.has(bg);

  const imageUrl = `${SUPABASE_URL}/storage/v1/object/public/car-numbers/${num}.webp`;

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full shrink-0 ${dim}`}
      style={{
        backgroundColor: bg || 'hsl(var(--racing-blue))',
        boxShadow: isDark ? '0 0 0 1px rgba(255,255,255,0.25)' : undefined,
      }}
    >
      <img
        src={imageUrl}
        alt={`#${num}`}
        className={`${imgSize} object-contain`}
        loading="lazy"
        onError={(e) => {
          const target = e.currentTarget;
          target.style.display = 'none';
          const parent = target.parentElement;
          if (parent && !parent.querySelector('.car-badge-fallback')) {
            const span = document.createElement('span');
            span.className = `car-badge-fallback font-heading text-white ${size === 'sm' ? 'text-[10px]' : size === 'lg' ? 'text-2xl' : 'text-xs'}`;
            span.textContent = num;
            parent.appendChild(span);
          }
        }}
      />
    </span>
  );
};

export default CarBadge;
