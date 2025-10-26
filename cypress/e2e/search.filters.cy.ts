// cypress/e2e/search.filters.cy.ts
describe('Search with filters', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/services/search', { fixture: 'services.melb.free.counselling.json' }).as('search');
    cy.visit('/');
  });

  it('filters by location, service type, and cost', () => {
    cy.findByLabelText(/location/i).type('Melbourne');
    cy.findByLabelText(/service type/i).select('Counselling');
    cy.findByLabelText(/cost/i).select('Free');
    cy.findByRole('button', { name: /search/i }).click();

    cy.wait('@search').its('request.body').should((body) => {
      expect(body.location).to.eq('Melbourne');
      expect(body.service_type).to.include('Counselling');
      expect(body.cost).to.include('Free');
    });

    cy.findAllByRole('listitem', { name: /service result/i }).should('have.length.at.least', 1);
    cy.contains(/headspace|beyond blue|phn/i); // sanity that results render
  });
});
