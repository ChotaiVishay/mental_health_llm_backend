// cypress/e2e/auth.reset.cy.ts
describe('Auth: password reset', () => {
  it('requests reset link', () => {
    cy.visit('/forgot-password');
    cy.findByLabelText(/email/i).type('user@example.com');
    cy.findByRole('button', { name: /send reset/i }).click();
    cy.contains(/check your email|reset link sent/i);
  });

  it('sets new password via reset link', () => {
    cy.visit('/reset-password?token=stub');
    cy.findByLabelText(/new password/i).type('NewStr0ngP@ss');
    cy.findByLabelText(/confirm/i).type('NewStr0ngP@ss');
    cy.findByRole('button', { name: /update password/i }).click();
    cy.contains(/password updated|you can now sign in/i);
  });
});
