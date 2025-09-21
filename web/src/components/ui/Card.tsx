import React from 'react';

type CardProps = React.ComponentProps<'div'> & {
  className?: string;
};

export default function Card({ className = '', ...rest }: CardProps) {
  // Accepts all regular <div> props (style, id, onClick, etc.)
  return <div className={`card ${className}`.trim()} {...rest} />;
}