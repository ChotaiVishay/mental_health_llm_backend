// src/components/layout/Container.tsx
import { ComponentPropsWithoutRef, ReactNode, ElementType } from 'react';

type ContainerProps<T extends ElementType> = {
  children: ReactNode;
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'className' | 'children'>;

export default function Container<T extends ElementType = 'div'>({
  children,
  as,
  className = '',
  ...rest
}: ContainerProps<T>) {
  const Component = (as ?? 'div') as ElementType;
  const composedClassName = ['container', className].filter(Boolean).join(' ');
  return (
    <Component className={composedClassName} {...rest}>
      {children}
    </Component>
  );
}
