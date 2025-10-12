import Title from '@/components/misc/Title';
import '@/styles/pages/login.css'; // reuse the login button styles
import { ADMIN_CONSOLE_URL, getAdminOAuthUrl } from '@/config/admin';

function ProviderButton({
  label,
  className,
  href,
  children,
}: {
  label: string;
  className: string;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      className={`oauth-btn ${className}`}
      href={href}
      aria-label={label}
      rel="noopener"
    >
      {children}
      {label}
    </a>
  );
}

export default function AdminSignIn() {
  const googleUrl = getAdminOAuthUrl('google');
  const githubUrl = getAdminOAuthUrl('github');
  const appleUrl = getAdminOAuthUrl('apple');

  return (
    <section className="auth-page" aria-labelledby="admin-auth-title">
      <div className="auth-card" role="dialog" aria-modal="true" aria-labelledby="admin-auth-title">
        <Title value="Admin sign-in" />
        <h1 id="admin-auth-title" className="h1">Admin sign-in</h1>
        <p className="muted">Sign in to access the admin console (Django Admin).</p>

        <div className="oauth-list" role="group" aria-label="Admin sign in with">
          {/* Render only the providers that are configured in env */}
          {googleUrl && (
            <ProviderButton label="Continue with Google" className="-google" href={googleUrl}>
              {/* minimalist G icon */}
              <svg viewBox="0 0 48 48" width="20" height="20" className="ic" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.2 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.2l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
                <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.4l-7.1-5.8c-2 1.3-4.6 2-8.2 2-6.3 0-11.6-4.2-13.5-9.8l-8 6.2C6.6 42.8 14.6 48 24 48z"/>
                <path fill="#4285F4" d="M47.6 24.5c0-1.7-.2-3.3-.6-4.9H24v9.3h13.4c-.6 3.1-2.5 5.7-5.3 7.4l7.1 5.8c4.1-3.8 6.4-9.4 6.4-17.6z"/>
                <path fill="#FBBC05" d="M9.5 29c-.4-1.2-.7-2.6-.7-4s.3-2.8.7-4l-8-6.2C.5 17.3 0 20.1 0 24s.5 6.7 1.5 9.2l8-6.2z"/>
              </svg>
            </ProviderButton>
          )}

          {githubUrl && (
            <ProviderButton label="Continue with GitHub" className="-github" href={githubUrl}>
              <svg viewBox="0 0 24 24" width="20" height="20" className="ic" aria-hidden="true">
                <path fill="currentColor" d="M12 .296a12 12 0 0 0-3.792 23.39c.6.112.82-.26.82-.58 0-.286-.01-1.04-.016-2.04-3.338.726-4.042-1.61-4.042-1.61-.546-1.39-1.334-1.76-1.334-1.76-1.09-.744.082-.73.082-.73 1.205.084 1.84 1.238 1.84 1.238 1.073 1.84 2.813 1.308 3.496.998.108-.776.42-1.308.763-1.61-2.665-.3-5.466-1.334-5.466-5.93 0-1.31.47-2.38 1.236-3.22-.124-.303-.536-1.523.116-3.176 0 0 1.01-.323 3.31 1.23a11.52 11.52 0 0 1 6.018 0c2.3-1.554 3.31-1.23 3.31-1.23.652 1.653.24 2.873.118 3.176.77.84 1.236 1.91 1.236 3.22 0 4.61-2.803 5.628-5.475 5.922.43.372.814 1.102.814 2.222 0 1.604-.015 2.896-.015 3.293 0 .32.216.694.825.576A12.004 12.004 0 0 0 12 .296z"/>
              </svg>
            </ProviderButton>
          )}

          {appleUrl && (
            <ProviderButton label="Continue with Apple" className="-apple" href={appleUrl}>
              <svg viewBox="0 0 24 24" width="18" height="18" className="ic" aria-hidden="true">
                <path fill="currentColor" fillRule="evenodd" clipRule="evenodd"
                  d="M19.665 13.769c-.036-3.288 2.691-4.89 2.814-4.965-1.538-2.243-3.918-2.56-4.764-2.595-2.051-.213-3.998 1.213-5.04 1.213-1.06 0-2.69-1.19-4.417-1.155-2.276.037-4.388 1.325-5.561 3.323-2.388 4.135-.612 10.244 1.722 13.59 1.144 1.634 2.52 3.47 4.312 3.408 1.721-.07 2.37-1.106 4.442-1.106s2.69 1.106 4.457 1.071c1.818-.03 2.946-1.653 4.072-3.294 1.285-1.87 1.82-3.684 1.855-3.789-.04-.02-3.577-1.376-3.592-5.701ZM13.73 3.22c.9-1.092 1.52-2.61 1.36-4.12-1.31.055-2.89.87-3.84 1.95-.83.96-1.56 2.5-1.37 4 1.37.11 2.75-.67 3.85-1.83Z"/>
              </svg>
            </ProviderButton>
          )}
        </div>

        {/* Always offer a direct link to the Django Admin UI */}
        <div className="auth-foot">
          <a className="btn" href={ADMIN_CONSOLE_URL}>Open Admin Console</a>
        </div>
      </div>
    </section>
  );
}