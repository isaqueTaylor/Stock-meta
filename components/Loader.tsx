import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoaderProps {
  large?: boolean;
}

export const Loader: React.FC<LoaderProps> = ({ large = false }) => {
  const sizeClass = large ? 'w-10 h-10' : 'w-5 h-5';

  return (
    <div className="flex items-center justify-center">
      <Loader2 className={`animate-spin text-indigo-500 ${sizeClass}`} />
    </div>
  );
};
