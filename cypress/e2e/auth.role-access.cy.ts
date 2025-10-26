// cypress/e2e/auth.role-access.cy.ts
describe('Auth: role-based access (not routing)', () => {
  it('Moderator can access moderation console', () => {
    cy.setCookie('role', 'moderator'); // or localStorage/session per your app
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/moderation');
    cy.contains(/moderation|approve|queue/i);
  });

  it('General user is blocked from admin pages', () => {
    cy.setCookie('role', 'user');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/moderation');
    cy.contains(/forbidden|no access|not allowed/i);
    // or redirect assertion
    // cy.url().should('not.include', '/admin');
  });
});
