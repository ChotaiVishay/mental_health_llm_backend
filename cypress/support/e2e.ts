// cypress/support/e2e.ts
import 'cypress-axe';

// cypress/e2e/a11y.scan.cy.ts
describe('A11y scan', () => {
  it('home has no serious violations', () => {
    cy.visit('/');
    cy.injectAxe();
    cy.checkA11y(null, { includedImpacts: ['serious', 'critical'] });
  });

  it('results page has no serious violations', () => {
    cy.visit('/results');
    cy.injectAxe();
    cy.checkA11y(null, { includedImpacts: ['serious', 'critical'] });
  });
});
