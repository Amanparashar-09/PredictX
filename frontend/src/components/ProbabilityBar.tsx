import { motion } from 'framer-motion';

interface ProbabilityBarProps {
  yesPrice: number;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
}

export function ProbabilityBar({ yesPrice, size = 'md', showLabels = false }: ProbabilityBarProps) {
  const yesPercent = Math.round(yesPrice * 100);
  const noPercent = 100 - yesPercent;
  
  const heights = {
    sm: 'h-1',
    md: 'h-1.5',
    lg: 'h-2',
  };

  return (
    <div className="w-full">
      {showLabels && (
        <div className="flex justify-between text-xs font-medium mb-1.5">
          <span className="text-success">Yes {yesPercent}%</span>
          <span className="text-destructive">No {noPercent}%</span>
        </div>
      )}
      <div className={`w-full ${heights[size]} rounded-full overflow-hidden bg-muted flex`}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${yesPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="h-full bg-gradient-to-r from-success to-success/70 rounded-l-full"
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${noPercent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          className="h-full bg-gradient-to-r from-destructive/70 to-destructive rounded-r-full"
        />
      </div>
    </div>
  );
}
