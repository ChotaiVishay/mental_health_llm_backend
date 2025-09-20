// src/components/ui/Button.tsx
import { ButtonHTMLAttributes } from 'react';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'primary';
};

export default function Button({ variant = 'default', className = '', ...rest }: Props) {
  const v = variant === 'primary' ? 'primary' : '';
  return <button className={`btn ${v} ${className}`.trim()} {...rest} />;
}