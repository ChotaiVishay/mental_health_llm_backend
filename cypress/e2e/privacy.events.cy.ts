// cypress/e2e/privacy.events.cy.ts
describe('Privacy: analytics/events contain no PII', () => {
  it('sends anonymised payloads only', () => {
    cy.intercept('POST', '/api/analytics/events').as('event');
    cy.visit('/');
    cy.findByRole('button', { name: /get started|search/i }).click();

    cy.wait('@event').its('request.body').should((body) => {
      expect(body).to.have.keys(['event', 'anonId', 'ts']);
      expect(body).not.to.have.any.keys('email', 'name', 'message', 'chat');
    });
  });
});
