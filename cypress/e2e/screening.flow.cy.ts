// cypress/e2e/screening.flow.cy.ts
describe('Screening flow', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/screening/submit').as('submit');
    cy.visit('/chat');
    // assume consent already accepted for this spec
    cy.window().then(w => w.localStorage.setItem('support-atlas:consent', JSON.stringify({ accepted: true, timestamp: Date.now() })));
    cy.reload();
  });

  it('prompts to complete missing items', () => {
    cy.contains(/start screening/i).click();
    cy.findByRole('button', { name: /submit/i }).click();
    cy.contains(/please complete all items|missing/i);
  });

  it('computes totals and stores', () => {
    cy.contains(/start screening/i).click();
    // Fill some radio groups or sliders (adjust selectors)
    cy.findAllByRole('radio').first().click();
    cy.findAllByRole('radio').eq(1).click();
    cy.findByRole('button', { name: /submit/i }).click();

    cy.wait('@submit').its('request.body').should((body) => {
      expect(body).to.have.property('total');
      expect(body.items).to.exist;
    });
    cy.contains(/thanks|saved|summary/i);
  });
});
