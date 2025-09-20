
import Title from '@/components/misc/Title';
import Card from '@/components/ui/Card';
import Grid from '@/components/layout/Grid';
import CrisisBanner from '@/components/crisis/CrisisBanner';
import { Link } from 'react-router-dom';

export default function HelpCrisis() {
  return (
    <>
      <Title value="Help & Crisis — Support Atlas" />

      {/* CRISIS BANNER (always first) */}
      <CrisisBanner />

      {/* QUICK HELP CARDS (design inspired by previous 'Help' page) */}
      <section aria-labelledby="help-cards-title" style={{ marginBottom: 24 }}>
        <h2 id="help-cards-title" style={{ margin: '8px 0' }}>Quick help</h2>
        <Grid cols={3}>
          <Card>
            <h3 style={{ marginTop: 0 }}>What is Support Atlas?</h3>
            <p>We list information about mental-health services so you can contact providers directly.
               We don’t diagnose or endorse.</p>
            <Link to="#faq-info" className="btn">Learn more</Link>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>Anonymous Chat</h3>
            <p>Use chat without an account. Messages aren’t stored. Sign in if you want to save history.</p>
            <Link to="/chat" className="btn">Open chat</Link>
          </Card>
          <Card>
            <h3 style={{ marginTop: 0 }}>List a Service</h3>
            <p>Suggest a new service or update an existing one. Anonymous suggestions go to moderation.</p>
            <a href="mailto:hello@example.com" className="btn">Email us</a>
          </Card>
        </Grid>
      </section>

      {/* FAQ — accessible details/summary keeps bundle tiny */}
      <section aria-labelledby="faq-title" style={{ marginBottom: 24 }}>
        <h2 id="faq-title" style={{ margin: '8px 0' }}>Frequently asked</h2>

        <details id="faq-info" style={detailsStyle}>
          <summary style={summaryStyle}>Is this medical advice or a referral service?</summary>
          <div style={panelStyle}>
            No. Support Atlas is an <strong>information directory</strong>. We don’t provide medical advice,
            diagnosis, referrals, or endorsements. Verify details directly with providers.
          </div>
        </details>

        <details style={detailsStyle}>
          <summary style={summaryStyle}>Can I use chat without an account?</summary>
          <div style={panelStyle}>
            Yes. Anonymous chat is available; messages aren’t stored. Sign in to save history and bookmarks.
          </div>
        </details>

        <details style={detailsStyle}>
          <summary style={summaryStyle}>How do I find services near me?</summary>
          <div style={panelStyle}>
            Use <Link to="/services">Services</Link> to browse a unified list with sorts.
          </div>
        </details>

        <details style={detailsStyle}>
          <summary style={summaryStyle}>How do I list or update a service?</summary>
          <div style={panelStyle}>
            Contact us with the change; anonymous suggestions are reviewed before publishing.
          </div>
        </details>

        <details style={detailsStyle}>
          <summary style={summaryStyle}>What about privacy?</summary>
          <div style={panelStyle}>
            We minimise data collection and support anonymous chat. Read our Privacy page for details.
          </div>
        </details>
      </section>

      {/* CONTACT PANEL */}
      <section aria-labelledby="contact-title" style={{
        background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12, padding: 16, marginBottom: 24
      }}>
        <h2 id="contact-title" style={{ margin: '8px 0' }}>Still need help?</h2>
        <p>Ask in chat or contact us. For emergencies, call <strong>000</strong>.</p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/chat" className="btn btn-primary">Ask in chat</Link>
          <a className="btn" href="mailto:hello@example.com">Email support</a>
        </div>
      </section>

      {/* CRISIS FOOTNOTE */}
      <section aria-label="Crisis footnote" style={{ marginBottom: 8 }}>
        <Card>
          <p style={{ margin: 0 }}>
            If you’re in immediate danger, call <strong>000</strong>. 24/7 support: Lifeline <strong>13 11 14</strong>,
            Kids Helpline <strong>1800 55 1800</strong>, Beyond Blue <strong>1300 22 4636</strong>.
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