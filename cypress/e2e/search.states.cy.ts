// cypress/e2e/search.states.cy.ts
describe('Search states', () => {
  it('shows empty state', () => {
    cy.intercept('POST', '/api/services/search', []).as('search');
    cy.visit('/');
    cy.findByRole('button', { name: /search/i }).click();
    cy.contains(/no results|try adjusting filters/i);
  });

  it('shows API error toast and retry button', () => {
    cy.intercept('POST', '/api/services/search', { statusCode: 500, body: { message: 'boom' } }).as('search');
    cy.visit('/');
    cy.findByRole('button', { name: /search/i }).click();
    cy.contains(/something went wrong|retry/i);
  });

  it('shows loading indicator during slow response', () => {
    cy.intercept('POST', '/api/services/search', (req) => req.reply((res) => {
      res.setDelay(1500).send({ fixtures: 'services.melb.free.counselling.json' });
    }));
    cy.visit('/');
    cy.findByRole('button', { name: /search/i }).click();
    cy.findByLabelText(/loading/i).should('be.visible');
  });
});
