import { useNavigate } from 'react-router-dom';
import { savePreloginChat } from '@/features/chat/sessionStore';

export default function Home() {
  const nav = useNavigate();

  const start = (seed?: string) => {
    if (seed) {
      // Pre-seed the anonymous store with the first user message.
      const now = Date.now();
      savePreloginChat({
        messages: [
          { id: `u_${now}`, role: 'user', text: seed, at: now },
        ],
      });
    }
    nav('/chat');
  };

  return (
    <section className="hero" style={{ paddingBlock: 24 }}>
      <h1 className="h1" style={{ marginTop: 0 }}>Support Atlas Assistant</h1>
      <p className="lead" style={{ maxWidth: 720 }}>
        Find mental health services and answers fast — chat anonymously, sign in later to save.
      </p>

      <div className="card" style={{ display: 'grid', gap: 16 }}>
        {/* Keep exact text so legacy tests can find it */}
        <button
          type="button"
          className="btn btn-primary"
          style={{ width: '100%', paddingBlock: 14, fontSize: 18 }}
          aria-describedby="cta-helptext"
          onClick={() => start()}
        >
          Start Chat
        </button>

        <div id="cta-helptext" className="muted">
          No sign-in required. You can sign in later if you want your conversation history saved.
        </div>

        {/* Quick prompts (optional) */}
        <div aria-label="Quick prompts" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {[
            'Find a psychologist near me',
            'Low-cost counselling options',
            'Crisis help in Australia',
            'LGBTQIA+ friendly services',
          ].map((q) => (
            <button
              key={q}
              type="button"
              className="chip"
              aria-label={`Start chat with: ${q}`}
              onClick={() => start(q)}
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}