import chevyLogo from '@/assets/chevy-logo.png';
import hondaLogo from '@/assets/honda-logo.png';

interface EngineIconProps {
  engine: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: 'w-5 h-3',
  md: 'w-6 h-4',
  lg: 'w-7 h-5',
};

const EngineIcon = ({ engine, size = 'sm', className = '' }: EngineIconProps) => {
  const isHonda = engine?.toLowerCase().includes('honda') || engine === 'H';
  const isChevy = engine?.toLowerCase().includes('chevy') || engine?.toLowerCase().includes('chevrolet') || engine === 'C';

  if (!isHonda && !isChevy) {
    return <span className="font-mono text-xs text-racing-muted">{engine}</span>;
  }

  return (
    <img
      src={isHonda ? hondaLogo : chevyLogo}
      alt={isHonda ? 'Honda' : 'Chevrolet'}
      title={isHonda ? 'Honda' : 'Chevrolet'}
      className={`${sizeMap[size]} w-auto inline-block ${className}`}
    />
  );
};

export default EngineIcon;
