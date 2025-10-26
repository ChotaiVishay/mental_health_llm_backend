// cypress/e2e/auth.logout.cy.ts
describe('Auth: logout', () => {
  it('invalidates session and redirects', () => {
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/');
    cy.findByRole('button', { name: /logout/i }).click();
    cy.contains(/signed out|logged out/i);
    cy.window().then(w => expect(w.localStorage.getItem('sb:token')).to.be.null);
  });
});
