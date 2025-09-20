export default function SupportedLangNote() {
  const langs =
    (import.meta.env.VITE_SUPPORTED_LANGS as string | undefined)
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean) ?? ['English'];

  return (
    <p style={{ color: '#6B7280', fontSize: 14, marginTop: 8 }}>
      Supported languages: {langs.join(', ')}
    </p>
  );
}