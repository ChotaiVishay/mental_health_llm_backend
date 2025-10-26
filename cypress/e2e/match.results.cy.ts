// cypress/e2e/match.results.cy.ts
describe('Match results behaviours', () => {
  it('shows 2-4 cards with contact + hours', () => {
    cy.intercept('POST', '/api/services/match', { fixture: 'match.3.results.json' }).as('match');
    cy.visit('/results');
    cy.wait('@match');
    cy.findAllByRole('article', { name: /provider card/i }).should('have.length.greaterThan', 1).and('have.length.lessThan', 5);
    cy.contains(/hours|open|mon|fri/i);
    cy.get('a[href^="tel:"]').should('exist');
  });

  it('shows telehealth or broader radius when no local matches', () => {
    cy.intercept('POST', '/api/services/match', { body: { results: [], fallback: { telehealth: [{ id: 1 }], radiusKm: 25 } } });
    cy.visit('/results');
    cy.contains(/telehealth options|broaden your search|within 25 km/i);
  });
});
