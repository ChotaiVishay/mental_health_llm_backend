// cypress/e2e/a11y.keyboard.cy.ts
describe('Keyboard navigation', () => {
  it('tab order reaches search controls and results', () => {
    cy.visit('/');
    cy.realPress('Tab'); // needs cypress-real-events
    cy.focused().should('have.attr', 'aria-label').and('match', /location/i);

    cy.realPress('Tab');
    cy.focused().should('have.attr', 'aria-label').and('match', /service type/i);

    cy.realPress('Tab');
    cy.focused().should('have.role', 'button').and('have.text', /search/i);
  });
});

