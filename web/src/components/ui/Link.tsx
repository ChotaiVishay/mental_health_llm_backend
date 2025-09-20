// src/components/ui/Link.tsx
import { Link as RRLink, LinkProps as RRLinkProps } from 'react-router-dom';

type Props = RRLinkProps & { external?: boolean };

export default function Link({ external, ...props }: Props) {
  if (external) {
    return <a {...props} target="_blank" rel="noreferrer noopener" />;
  }
  return <RRLink {...props} />;
}