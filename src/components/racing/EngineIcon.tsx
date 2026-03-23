import chevyLogo from '@/assets/chevy-logo.png';
import hondaLogo from '@/assets/honda-logo.png';

interface EngineIconProps {
  engine: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-6 h-4',
  md: 'w-8 h-5',
  lg: 'w-10 h-6',
};

const EngineIcon = ({ engine, size = 'sm', className = '' }: EngineIconProps) => {
  const isHonda = engine?.toLowerCase().includes('honda') || engine === 'H';
  const isChevy = engine?.toLowerCase().includes('chevy') || engine?.toLowerCase().includes('chevrolet') || engine === 'C';

  if (!isHonda && !isChevy) {
    return <span className="font-mono text-xs text-racing-muted">{engine}</span>;
  }

  return (
    <span className={`${sizeMap[size]} inline-flex items-center justify-center ${className}`}>
      <img
        src={isHonda ? hondaLogo : chevyLogo}
        alt={isHonda ? 'Honda' : 'Chevrolet'}
        title={isHonda ? 'Honda' : 'Chevrolet'}
        className="max-h-full max-w-full object-contain"
      />
    </span>
  );
};

export default EngineIcon;
