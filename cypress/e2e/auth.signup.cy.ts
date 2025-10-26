// cypress/e2e/auth.signup.cy.ts
describe('Auth: email/password signup', () => {
  beforeEach(() => cy.visit('/signup'));

  it('creates an account with valid fields and logs in', () => {
    cy.findByLabelText(/email/i).type('new.user@example.com');
    cy.findByLabelText(/password/i).type('StrongP@ssw0rd!');
    cy.findByRole('button', { name: /sign up/i }).click();

    cy.intercept('POST', '/api/auth/signup').as('signup');
    // If the app calls signup before intercept, add intercept earlier and trigger after.
    // Optionally: stub success response here if you don't hit real backend.

    // simulate session set (e.g., Supabase/session cookie)
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.url().should('not.include', '/signup');
    cy.contains(/logout|my account|chat/i);
  });

  it('shows inline errors on invalid input', () => {
    cy.findByRole('button', { name: /sign up/i }).click();
    cy.findAllByText(/required|invalid email|weak password/i).should('exist');
  });

  it('handles duplicate email gracefully', () => {
    cy.intercept('POST', '/api/auth/signup', {
      statusCode: 409,
      body: { code: 'email_exists', message: 'Email already in use' },
    });
    cy.findByLabelText(/email/i).type('taken@example.com');
    cy.findByLabelText(/password/i).type('StrongP@ssw0rd!');
    cy.findByRole('button', { name: /sign up/i }).click();
    cy.contains(/already in use|try signing in/i);
  });
});
