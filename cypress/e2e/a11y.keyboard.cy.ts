// cypress/e2e/a11y.keyboard.cy.ts
describe('Keyboard navigation', () => {
  it('tab order reaches search controls and results', () => {
    cy.visit('/');
    cy.get('body').realPress('Tab');
    cy.focused()
      .should('have.attr', 'href')
      .and('match', /#main/);

    cy.focused().realPress('Tab');
    cy.focused().should('have.attr', 'aria-label').and('match', /location/i);

    cy.focused().realPress('Tab');
    cy.focused().should('have.attr', 'aria-label').and('match', /service type/i);

    cy.focused().realPress('Tab');
    cy.focused().should('have.role', 'button').and('have.text', /search/i);
  });
});

