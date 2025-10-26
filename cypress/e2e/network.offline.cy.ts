// cypress/e2e/network.offline.cy.ts
describe('Offline / slow network UX', () => {
  it('shows offline banner and preserves input', () => {
    cy.visit('/');
    cy.findByRole('textbox').type('anxiety support');
    cy.intercept('POST', '/api/services/search', { forceNetworkError: true }).as('search');
    cy.findByRole('button', { name: /search/i }).click();
    cy.wait('@search');
    cy.contains(/offline|connection|retry/i);
    cy.findByRole('textbox').should('have.value', 'anxiety support');
  });
});
