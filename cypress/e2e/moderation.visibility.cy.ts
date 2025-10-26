// cypress/e2e/moderation.visibility.cy.ts
describe('Moderation: toggle active/inactive', () => {
  beforeEach(() => {
    cy.setCookie('role', 'moderator');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/listings/123'); // adjust route
  });

  it('inactive listing is hidden from user search', () => {
    cy.intercept('PATCH', '/api/listings/123', { statusCode: 200, body: { active: false } }).as('toggle');
    cy.findByRole('switch', { name: /active/i }).click();
    cy.wait('@toggle');

    cy.visit('/'); // user search
    cy.intercept('POST', '/api/services/search', { fixture: 'services.none.json' });
    cy.findByRole('button', { name: /search/i }).click();
    cy.contains(/no results/i);
  });
});
