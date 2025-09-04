import './spinner.css';

interface SpinnerProps {
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export default function Spinner({ size = 'medium', className = '' }: SpinnerProps) {
  const sizeClasses = {
    small: 'w-4 h-4 max-w-4',
    medium: 'w-6 h-6 max-w-6 md:w-8 md:h-8 md:max-w-8',
    large: 'w-8 h-8 max-w-8 md:w-12 md:h-12 md:max-w-12'
  };

  return (
    <div className={`loader ${sizeClasses[size]} ${className}`} />
  );
}