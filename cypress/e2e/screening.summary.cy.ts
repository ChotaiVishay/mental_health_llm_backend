// cypress/e2e/screening.summary.cy.ts
describe('Screening summary (plain language)', () => {
  it('shows empathetic non-diagnostic summary', () => {
    cy.intercept('GET', '/api/screening/latest', { fixture: 'screening.latest.json' });
    cy.visit('/summary');
    cy.contains(/this is not a diagnosis|information only|next steps/i);
    cy.contains(/medication|prescribe|diagnose/i).should('not.exist'); // rough negative check
  });
});
