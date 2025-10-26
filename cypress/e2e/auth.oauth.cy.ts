// cypress/e2e/auth.oauth.cy.ts
describe('Auth: OAuth Google/GitHub', () => {
  beforeEach(() => cy.visit('/login'));

  ['google', 'github'].forEach(provider => {
    it(`logs in with ${provider}`, () => {
      cy.intercept('GET', `/api/auth/${provider}/callback*`, {
        statusCode: 200,
        body: { token: 'oauth-token', role: 'user' },
      });
      cy.findByRole('button', { name: new RegExp(provider, 'i') }).click();
      // simulate callback
      cy.window().then(w => w.localStorage.setItem('sb:token', 'oauth-token'));
      cy.contains(/logout|my account/i);
    });

    it(`${provider} error shows message`, () => {
      cy.intercept('GET', `/api/auth/${provider}/callback*`, {
        statusCode: 400,
        body: { message: 'OAuth error' },
      });
      cy.findByRole('button', { name: new RegExp(provider, 'i') }).click();
      cy.contains(/couldn’t sign you in|try again/i);
    });
  });
});
