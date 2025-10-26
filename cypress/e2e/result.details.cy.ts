// cypress/e2e/result.details.cy.ts
describe('Service details view', () => {
  it('opens a service and has safe links', () => {
    cy.intercept('POST', '/api/services/search', { fixture: 'services.single.json' });
    cy.visit('/');
    cy.findByRole('button', { name: /search/i }).click();
    cy.findByRole('link', { name: /view details/i }).first().click();

    cy.findByRole('heading', { name: /service details/i }).should('be.visible');

    // external websites open in new tab and are noopener
    cy.findByRole('link', { name: /website/i })
      .should('have.attr', 'target', '_blank')
      .and('have.attr', 'rel').and('match', /noopener/i);

    // tel links exist for quick help
    cy.get('a[href^="tel:"]').should('exist');
  });
});
