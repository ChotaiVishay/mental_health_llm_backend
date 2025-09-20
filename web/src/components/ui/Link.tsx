// src/components/ui/Link.tsx
import { ReactNode } from 'react';

type Props = React.ComponentProps<'a'> & {
  children?: ReactNode;
  'aria-label'?: string; // allow icon-only links with label
};

export default function Link({ children, className = '', ...rest }: Props) {
  const hasContent = !!children || !!rest['aria-label'];
  if (!hasContent) {
    // developer-friendly error in dev, but keeps runtime safe
    if (import.meta.env.DEV) {
      console.warn('Link requires children or aria-label for accessibility');
    }
  }
  return (
    <a className={`app-link ${className}`} {...rest}>
      {children ?? rest['aria-label'] /* ensures accessible content */}
    </a>
  );
}