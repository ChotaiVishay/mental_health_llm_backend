import Container from '@/components/layout/Container';
import Title from '@/components/misc/Title';

const sections = [
  {
    id: 'overview',
    heading: '1. Overview',
    body: [
      'Support Atlas provides information, triage tools, and chat-based guidance to help you find mental-health support. These Terms of Service (“Terms”) explain how you may use our products and services.',
      'By accessing Support Atlas you agree to these Terms. If you do not agree, please do not use the service.',
    ],
  },
  {
    id: 'eligibility',
    heading: '2. Eligibility & Account',
    body: [
      'You must be at least 16 years old to create an account. If you are younger than 16, please use the service with a trusted adult.',
      'You are responsible for maintaining the security of your account credentials and for activity that occurs under your account.',
    ],
  },
  {
    id: 'acceptable-use',
    heading: '3. Acceptable Use',
    body: [
      'Use Support Atlas only for lawful purposes. You agree not to:',
      '• Attempt to interfere with the operation or security of the platform.',
      '• Engage in activity that infringes intellectual property or privacy rights.',
      'We may suspend access to users who violate these Terms.',
    ],
  },
  {
    id: 'information',
    heading: '4. Information, Not Medical Advice',
    body: [
      'Support Atlas is not a substitute for professional medical advice, diagnosis, or treatment. Our chat assistant and curated resources provide general information to help you connect with health services.',
      'If you experience a crisis or medical emergency, call 000 in Australia or contact the nearest emergency service.',
    ],
  },
  {
    id: 'services',
    heading: '5. Third-Party Services',
    body: [
      'Support Atlas references external service providers and resources. These providers operate independently and may have their own terms, privacy policies, and eligibility requirements.',
      'We are not responsible for the availability, accuracy, or outcomes of third-party services. Interactions with providers are solely between you and the provider.',
    ],
  },
  {
    id: 'privacy',
    heading: '6. Privacy & Data',
    body: [
      'Our Privacy Policy explains how we collect and handle personal information. By using Support Atlas you consent to those practices.',
      'We minimise data collection and use encryption, access controls, and monitoring to protect stored information. No system is perfectly secure, so please use discretion when sharing personal details.',
    ],
  },
  {
    id: 'ai',
    heading: '7. AI-assisted Responses',
    body: [
      'Some chat responses are generated or assisted by large language models. These models may produce inaccurate or outdated information.',
      'We monitor and continuously improve the assistant, but you should verify important details (such as provider availability, fees, or crisis advice) before acting on them.',
    ],
  },
  {
    id: 'updates',
    heading: '8. Changes to the Service',
    body: [
      'We may update, pause, or discontinue features at any time to improve the experience or comply with legal obligations.',
      'When material changes affect your rights, we will provide reasonable notice. Continued use after updates means you accept the revised Terms.',
    ],
  },
  {
    id: 'disclaimer',
    heading: '9. Disclaimer & Liability',
    body: [
      'Support Atlas is provided “as is” without warranties of any kind, express or implied. We do not guarantee uninterrupted access, accuracy of listings, or outcomes from contacting providers.',
      'To the extent permitted by law, our liability for loss or damage arising out of these Terms or your use of Support Atlas is limited to AUD $100.',
    ],
  },
  {
    id: 'contact',
    heading: '10. Contact & Feedback',
    body: [
      'Product improvements rely on insight from the community. You can share feedback through in-app surveys and questionnaires when they appear.',
      'If you believe these Terms have been violated, please use the reporting tools provided within Support Atlas so we can investigate.',
    ],
  },
];

export default function Terms() {
  return (
    <Container as="article" className="legal-page">
      <Title value="Terms of Service • Support Atlas" />

      <header className="legal-header">
        <p className="legal-eyebrow">Updated 27 October 2025</p>
        <h1>Terms of Service</h1>
        <p>
          These Terms describe your rights and responsibilities when using Support Atlas. Please read them carefully
          before continuing with the chat or any related services.
        </p>
      </header>

      <nav className="legal-toc" aria-label="Terms of Service sections">
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
        <p>
          By selecting “I agree” in the chat, you confirm that you have read, understand, and agree to be bound by these Terms.
        </p>
        <p>
          If you have questions, <a href="/contact">contact us</a>.
        </p>
      </footer>
    </Container>
  );
}
