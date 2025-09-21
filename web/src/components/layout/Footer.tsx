import Container from './Container';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <Container>
        <div className="footer-cols">
          <div>
            <div className="brand">
              <span aria-hidden className="logo">SA</span>
              <strong>Support Atlas</strong>
            </div>
            <p className="muted small" style={{ marginTop: 8 }}>
              © {year} Support Atlas. All rights reserved.
            </p>
          </div>

          <nav aria-label="Site">
            <ul className="footer-list">
              <li><a href="/admin">Admin</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/privacy">Privacy</a></li>
              <li><a href="/contact">Contact</a></li>
            </ul>
          </nav>

          <div>
            <p className="footer-disclaimer small">
              <strong>Disclaimer:</strong> Support Atlas is an informational directory
              and chat experience. We don’t provide clinical advice, diagnosis, or
              treatment. If you’re in crisis or at risk of harm, call your local
              emergency number immediately. Service details may change; always confirm
              with providers.
            </p>
          </div>
        </div>
      </Container>
    </footer>
  );
}