// cypress/e2e/security.2fa.cy.ts
describe('Security: 2FA (optional)', () => {
  beforeEach(() => {
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/security');
  });

  it('enables 2FA and shows recovery codes', () => {
    cy.intercept('POST', '/api/2fa/setup', { fixture: '2fa.setup.json' }).as('setup');
    cy.findByRole('button', { name: /enable 2fa/i }).click();
    cy.wait('@setup');
    cy.contains(/scan this qr|recovery codes/i);
  });

  it('login on new device requires totp', () => {
    // Simulate new device by clearing cookies but keeping account
    cy.clearCookies();
    cy.visit('/login');
    cy.findByLabelText(/email/i).type('user@example.com');
    cy.findByLabelText(/^password$/i).type('NewStr0ngP@ss');
    cy.findByRole('button', { name: /sign in/i }).click();

    cy.contains(/enter 2fa code|authenticator/i);
    cy.findByLabelText(/code/i).type('000000');
    cy.findByRole('button', { name: /verify/i }).click();
    cy.contains(/invalid code/i);
  });
});
