// cypress/e2e/legal.static.cy.ts
describe('Legal & Crisis static pages', () => {
  it('footer links exist and open Terms/Privacy', () => {
    cy.visit('/');
    cy.findByRole('link', { name: /privacy/i }).should('have.attr', 'href').and('match', /privacy/);
    cy.findByRole('link', { name: /terms/i }).should('have.attr', 'href').and('match', /terms/);
  });

  it('crisis page mentions 000 and Lifeline', () => {
    cy.visit('/crisis');
    cy.contains(/000|lifeline|13 11 14/i);
  });
});
