import Container from '@/components/layout/Container';
import Title from '@/components/misc/Title';

const sections = [
  {
    id: 'introduction',
    heading: '1. Introduction',
    body: [
      'Support Atlas respects your privacy. This Privacy Policy explains what personal information we collect, why we collect it, and how we protect it.',
      'We follow the Australian Privacy Principles under the Privacy Act 1988 (Cth).',
    ],
  },
  {
    id: 'data-we-collect',
    heading: '2. Information We Collect',
    body: [
      '• Account information: When you sign up we store your name, email, and authentication identifiers managed by Supabase.',
      '• Chat interactions: Anonymous chat transcripts are temporarily stored so you can continue a session or share them with a professional.',
      '• Usage data: We collect device type, browser, and approximate location (country/state) to improve service quality.',
      '• Feedback: Comments, support requests, or survey responses you choose to submit.',
    ],
  },
  {
    id: 'how-we-use',
    heading: '3. How We Use Information',
    body: [
      '• Provide the chat experience and surface relevant services.',
      '• Monitor service quality, performance, and security.',
      '• Respond to your requests and communicate updates.',
      '• Conduct research and product improvements using aggregated and de-identified data.',
    ],
  },
  {
    id: 'storage',
    heading: '4. Storage & Retention',
    body: [
      'Chat transcripts are stored in encrypted databases managed by Supabase in Australia.',
      'For anonymous users, transcripts are retained for up to 30 days unless you manually clear them. Signed-in users may delete conversations from their account dashboard.',
      'We retain essential account records while your account is active and for a reasonable period afterwards to comply with legal obligations.',
    ],
  },
  {
    id: 'sharing',
    heading: '5. Sharing & Disclosure',
    body: [
      'We do not sell personal information. We share data only with:',
      '• Infrastructure providers (Supabase, Vercel, OpenAI) who help us operate the service and are bound by contractual confidentiality.',
      '• Support professionals you explicitly request we contact or share summaries with.',
      '• Law enforcement or regulators when required by law or when necessary to prevent harm.',
    ],
  },
  {
    id: 'ai-processing',
    heading: '6. AI Processing',
    body: [
      'We use large language models to generate chat responses. Messages sent for processing are encrypted in transit and deleted after the model produces a response.',
      'We do not use your conversations to train public AI models.',
    ],
  },
  {
    id: 'security',
    heading: '7. Security',
    body: [
      'We apply layered security: encryption at rest and in transit, strict access controls, monitoring for suspicious activity, and regular penetration tests.',
      'No online service is completely secure. Please avoid sharing sensitive identifiers such as Medicare numbers unless necessary.',
    ],
  },
  {
    id: 'your-rights',
    heading: '8. Your Rights',
    body: [
      'You may request access to the personal information we hold about you, ask us to correct it, or request deletion where legally permitted.',
      'Contact privacy@supportatlas.org with your request. We may need to verify your identity before acting on it.',
    ],
  },
  {
    id: 'children',
    heading: '9. Children',
    body: [
      'Support Atlas is designed for older teens and adults. If you believe a child under 13 has provided personal information without consent, contact us so we can remove it.',
    ],
  },
  {
    id: 'updates',
    heading: '10. Updates',
    body: [
      'We may update this Privacy Policy to reflect product changes or legal requirements. Significant changes will be announced in-app or via email.',
      'The “Updated” date at the top of this page shows the latest revision.',
    ],
  },
  {
    id: 'contact',
    heading: '11. Contact',
    body: [
      'For privacy questions or complaints, email privacy@supportatlas.org. We will respond within 10 business days.',
    ],
  },
];

export default function Privacy() {
  return (
    <Container as="article" className="legal-page">
      <Title value="Privacy Policy • Support Atlas" />

      <header className="legal-header">
        <p className="legal-eyebrow">Updated 27 October 2025</p>
        <h1>Privacy Policy</h1>
        <p>
          We believe mental-health support should be private, safe, and respectful. This policy outlines how Support Atlas handles
          your information and the controls you have.
        </p>
      </header>

      <nav className="legal-toc" aria-label="Privacy Policy sections">
        <h2>Summary</h2>
        <ul>
          {sections.map((section) => (
            <li key={section.id}>
              <a href={`#${section.id}`}>{section.heading}</a>
            </li>
          ))}
        </ul>
      </nav>

      {sections.map((section) => (
        <section key={section.id} id={section.id} className="legal-section">
          <h2>{section.heading}</h2>
          {section.body.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>
      ))}

      <footer className="legal-footer">
        <p>This policy will be updated as Support Atlas evolves. Please check back periodically for the latest version.</p>
      </footer>
    </Container>
  );
}
