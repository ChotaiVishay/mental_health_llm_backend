// src/components/layout/Container.tsx
import { ReactNode } from 'react';

export default function Container({ children, as: Tag = 'div', className = '' }: {
  children: ReactNode;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
}) {
  const Cmp = Tag as any;
  return <Cmp className={`container ${className}`}>{children}</Cmp>;
}