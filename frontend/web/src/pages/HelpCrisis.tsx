import Title from '@/components/misc/Title';
import Card from '@/components/ui/Card';
import Grid from '@/components/layout/Grid';
import CrisisBanner from '@/components/crisis/CrisisBanner';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useTranslation } from '@/i18n/LanguageProvider';

function renderWithStrong(text: string) {
  return text
    .split(/(\*\*.*?\*\*)/g)
    .filter(Boolean)
    .map((part, idx) => (
      part.startsWith('**') && part.endsWith('**')
        ? <strong key={idx}>{part.slice(2, -2)}</strong>
        : <span key={idx}>{part}</span>
    ));
}

export default function HelpCrisis() {
  const t = useTranslation();

  const quickCards = useMemo(
    () => [
      {
        title: t('help.quick.card1.title'),
        body: t('help.quick.card1.body'),
        action: <Link to="#faq-info" className="btn">{t('help.quick.card1.button')}</Link>,
      },
      {
        title: t('help.quick.card2.title'),
        body: t('help.quick.card2.body'),
        action: <Link to="/chat" className="btn">{t('help.quick.card2.button')}</Link>,
      },
      {
        title: t('help.quick.card3.title'),
        body: t('help.quick.card3.body'),
        action: <a href="mailto:hello@example.com" className="btn">{t('help.quick.card3.button')}</a>,
      },
    ],
    [t],
  );

  const faqItems = useMemo(
    () => [
      {
        id: 'faq-info',
        question: t('help.faq.q1.question'),
        answer: (
          <>
            {t('help.faq.q1.answer')}
          </>
        ),
      },
      {
        question: t('help.faq.q2.question'),
        answer: <>{t('help.faq.q2.answer')}</>,
      },
      {
        question: t('help.faq.q3.question'),
        answer: (
          <>
            {t('help.faq.q3.answer.part1')}{' '}
            <Link to="/services">{t('help.faq.q3.answer.link')}</Link>{' '}
            {t('help.faq.q3.answer.part2')}
          </>
        ),
      },
      {
        question: t('help.faq.q4.question'),
        answer: <>{t('help.faq.q4.answer')}</>,
      },
      {
        question: t('help.faq.q5.question'),
        answer: <>{t('help.faq.q5.answer')}</>,
      },
    ],
    [t],
  );

  return (
    <>
      <Title value={t('help.metaTitle')} />

      {/* CRISIS BANNER (always first) */}
      <CrisisBanner />

      {/* QUICK HELP CARDS (design inspired by previous 'Help' page) */}
      <section aria-labelledby="help-cards-title" style={{ marginBottom: 24 }}>
        <h2 id="help-cards-title" style={{ margin: '8px 0' }}>{t('help.quick.title')}</h2>
        <Grid cols={3}>
          {quickCards.map((card) => (
            <Card key={card.title}>
              <h3 style={{ marginTop: 0 }}>{card.title}</h3>
              <p>{card.body}</p>
              {card.action}
            </Card>
          ))}
        </Grid>
      </section>

      {/* FAQ — accessible details/summary keeps bundle tiny */}
      <section aria-labelledby="faq-title" style={{ marginBottom: 24 }}>
        <h2 id="faq-title" style={{ margin: '8px 0' }}>{t('help.faq.title')}</h2>

        {faqItems.map(item => (
          <details key={item.question} id={item.id} style={detailsStyle}>
            <summary style={summaryStyle}>{item.question}</summary>
            <div style={panelStyle}>{item.answer}</div>
          </details>
        ))}
      </section>

      {/* CONTACT PANEL */}
      <section aria-labelledby="contact-title" style={{
        background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24
      }}>
        <h2 id="contact-title" style={{ margin: '8px 0' }}>{t('help.contact.title')}</h2>
        <p>
          {t('help.contact.body.part1')} <strong>000</strong>.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/chat" className="btn btn-primary">{t('help.contact.button.chat')}</Link>
          <a className="btn" href="mailto:hello@example.com">{t('help.contact.button.email')}</a>
        </div>
      </section>

      {/* CRISIS FOOTNOTE */}
      <section aria-label="Crisis footnote" style={{ marginBottom: 8 }}>
        <Card>
          <p style={{ margin: 0 }}>
            {renderWithStrong(t('help.footnote'))}
          </p>
        </Card>
      </section>
    </>
  );
}

const detailsStyle: React.CSSProperties = {
  border: '1px solid #E5E7EB',
  borderRadius: 10,
  padding: '8px 12px',
  marginBottom: 8,
  background: 'white'
};
const summaryStyle: React.CSSProperties = { cursor: 'pointer', fontWeight: 600 };
const panelStyle: React.CSSProperties = { marginTop: 8, color: '#374151' };
