import { ChangeEvent } from 'react';

import { useLanguage } from './LanguageProvider';
import type { SupportedLanguageCode } from './translations';

export default function LanguageSwitcher() {
  const { language, setLanguage, options, t } = useLanguage();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setLanguage(event.target.value as SupportedLanguageCode);
  };

  return (
    <label className="language-switcher" data-easy-mode="priority">
      <span className="sr-only">{t('header.language.select')}</span>
      <select
        aria-label={t('header.language.label')}
        value={language}
        onChange={handleChange}
      >
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.nativeLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
