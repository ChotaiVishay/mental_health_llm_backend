// cypress/e2e/moderation.queue.cy.ts
describe('Moderation queue approve/disable', () => {
  beforeEach(() => {
    cy.setCookie('role', 'moderator');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.intercept('GET', '/api/listings/pending', { fixture: 'listings.pending.json' }).as('pending');
    cy.visit('/admin/moderation');
    cy.wait('@pending');
  });

  it('approves a listing', () => {
    cy.intercept('POST', '/api/listings/*/approve', { statusCode: 200 }).as('approve');
    cy.findByRole('button', { name: /approve/i }).first().click();
    cy.wait('@approve').its('request.url').should('match', /\/api\/listings\/\d+\/approve/);
    cy.contains(/approved|published/i);
  });

  it('disables a listing with reason', () => {
    cy.intercept('POST', '/api/listings/*/disable', { statusCode: 200 }).as('disable');
    cy.findByRole('button', { name: /disable/i }).first().click();
    cy.findByLabelText(/reason/i).type('Duplicate');
    cy.findByRole('button', { name: /confirm/i }).click();
    cy.wait('@disable').its('request.body').should('deep.include', { reason: 'Duplicate' });
    cy.contains(/disabled|hidden/i);
  });
});
