// cypress/e2e/a11y.responsive.cy.ts
describe('Responsive layout', () => {
  const sizes: Cypress.ViewportPreset[] = ['iphone-6', 'ipad-2', 'macbook-15'];
  sizes.forEach(vp => {
    it(`works on ${vp}`, () => {
      cy.viewport(vp);
      cy.visit('/');
      cy.findByRole('navigation').should('be.visible');
      cy.findByRole('button', { name: /search/i }).should('be.visible');
    });
  });
});
