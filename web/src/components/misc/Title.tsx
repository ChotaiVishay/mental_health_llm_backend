import { useEffect } from 'react';

export default function Title({ value }: { value: string }) {
  useEffect(() => {
    const prev = document.title;
    document.title = value;
    return () => {
      document.title = prev;
    };
  }, [value]);
  return null;
}