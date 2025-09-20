// src/components/layout/Container.tsx
import { ReactNode, ElementType } from 'react';

type Props = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

export default function Container({ children, as: Tag = 'div', className = '' }: Props) {
  const Cmp = Tag as ElementType; // typed, not any
  return <Cmp className={`container ${className}`}>{children}</Cmp>;
}