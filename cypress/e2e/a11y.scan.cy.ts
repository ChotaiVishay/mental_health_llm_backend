describe('A11y scan', () => {
  beforeEach(() => {
    cy.injectAxe();
  });

  it('home has no serious violations', () => {
    cy.visit('/');
    cy.checkA11y(null, { includedImpacts: ['serious', 'critical'] });
  });

  it('results page has no serious violations', () => {
    cy.visit('/results');
    cy.checkA11y(null, { includedImpacts: ['serious', 'critical'] });
  });
});
