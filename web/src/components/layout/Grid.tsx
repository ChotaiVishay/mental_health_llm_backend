// src/components/layout/Grid.tsx
import { ReactNode } from 'react';

type GridProps = {
  children: ReactNode;
  cols?: 1 | 2 | 3;
  className?: string;
};

export default function Grid({ children, cols = 1, className = '' }: GridProps) {
  const colsClass = cols === 3 ? 'cols-3' : cols === 2 ? 'cols-2' : '';
  return <div className={`grid ${colsClass} ${className}`.trim()}>{children}</div>;
}