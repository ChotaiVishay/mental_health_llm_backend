import React from 'react';

export type Variant = 'default' | 'primary' | 'secondary' | 'link' | 'crisis';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export default function Button({
  variant = 'default',
  className = '',
  type = 'button', // safer default to avoid accidental form submits
  ...rest
}: ButtonProps) {
  const cls =
    'btn ' +
    (variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
      ? 'btn-secondary'
      : variant === 'link'
      ? 'btn-link'
      : variant === 'crisis'
      ? 'btn-crisis'
      : '');

  return <button type={type} className={`${cls} ${className}`.trim()} {...rest} />;
}