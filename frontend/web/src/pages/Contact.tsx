import Container from '@/components/layout/Container';

export default function Contact() {
  return (
    <Container as="section" className="contact-page" aria-labelledby="contact-heading">
      <header className="contact-hero">
        <p className="eyebrow">We’re here to help</p>
        <h1 id="contact-heading">Contact Support Atlas</h1>
        <p className="lead">
          Reach out to the team behind Support Atlas for partnerships, media enquiries, or demo access.
        </p>
      </header>

      <div className="contact-grid">
        <section className="contact-card" aria-labelledby="contact-support">
          <h2 id="contact-support">Talk with our team</h2>
          <p>We’re available weekdays, 9am–5pm AEST.</p>
          <dl>
            <div>
              <dt>Phone</dt>
              <dd><a href="tel:+611300000111">1300 000 111</a></dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd><a href="mailto:hello@supportatlas.org">hello@supportatlas.org</a></dd>
            </div>
            <div>
              <dt>Live demo</dt>
              <dd><a href="mailto:demo@supportatlas.org?subject=Request%20a%20Support%20Atlas%20demo">demo@supportatlas.org</a></dd>
            </div>
          </dl>
        </section>

        <section className="contact-card" aria-labelledby="contact-media">
          <h2 id="contact-media">Media &amp; speaking</h2>
          <p>
            For press kits, interviews, or event requests contact our communications lead.
          </p>
          <ul>
            <li>Email <a href="mailto:media@supportatlas.org">media@supportatlas.org</a></li>
            <li>Download the media kit (coming soon)</li>
            <li>Follow updates on <a href="https://www.linkedin.com/" target="_blank" rel="noreferrer">LinkedIn</a></li>
          </ul>
        </section>

        <section className="contact-card" aria-labelledby="contact-partners">
          <h2 id="contact-partners">Partnerships</h2>
          <p>
            We collaborate with clinics, universities, and wellbeing programs to make it easier for people to
            find the right support.
          </p>
          <ul>
            <li>Email <a href="mailto:partnerships@supportatlas.org">partnerships@supportatlas.org</a></li>
            <li>Schedule a discovery call: <a href="https://cal.com/">cal.com/supportatlas</a></li>
            <li>Download our partnership overview (PDF)</li>
          </ul>
        </section>

        <section className="contact-card" aria-labelledby="contact-office">
          <h2 id="contact-office">Visit our office</h2>
          <address>
            Level 4, 245 Support Street<br />
            Melbourne VIC 3000<br />
            Australia
          </address>
          <p>
            Meetings are by appointment only. <a href="https://maps.google.com" target="_blank" rel="noreferrer">Get directions</a>
          </p>
        </section>
      </div>

      <aside className="contact-footer" aria-label="Need urgent help">
        <h2>Need crisis support?</h2>
        <p>
          Support Atlas does not provide emergency services. If you or someone you know is in immediate danger call&nbsp;
          <strong>000</strong>. You can also reach Lifeline on <a href="tel:+61131411">13 11 14</a> or text <strong>0477 13 11 14</strong>.
        </p>
        <a className="btn btn-primary" href="/#help-crisis">See crisis contacts</a>
      </aside>
    </Container>
  );
}
