// cypress/e2e/profile.delete.cy.ts
describe('Profile: delete account', () => {
  it('deletes and signs out', () => {
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/profile');
    cy.intercept('DELETE', '/api/me', { statusCode: 204 }).as('del');
    cy.findByRole('button', { name: /delete account/i }).click();
    cy.findByRole('button', { name: /confirm/i }).click();
    cy.wait('@del');
    cy.contains(/account deleted|goodbye/i);
    cy.window().then(w => expect(w.localStorage.getItem('sb:token')).to.be.null);
  });
});
