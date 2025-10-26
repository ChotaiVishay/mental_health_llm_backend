// cypress/e2e/auth.cy.ts
describe('Auth flow (stubbed)', () => {
  it('logs in and preserves session across reload', () => {
    cy.visit('/login');
    cy.findByLabelText(/email/i).type('user@example.com');
    cy.findByRole('button', { name: /magic link/i }).click();

    // simulate Supabase callback storage
    cy.window().then((w) => w.localStorage.setItem('sb:token', 'test-token'));
    cy.visit('/');
    cy.contains(/logout|my account/i);
  });
});
