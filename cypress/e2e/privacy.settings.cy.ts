// cypress/e2e/privacy.settings.cy.ts
describe('Privacy settings', () => {
  beforeEach(() => {
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/privacy-settings');
  });

  it('toggles location sharing', () => {
    cy.intercept('PATCH', '/api/me/privacy', { statusCode: 200, body: { locationSharing: false } }).as('privacy');
    cy.findByRole('switch', { name: /location sharing/i }).click();
    cy.wait('@privacy');
    cy.contains(/saved|updated/i);
  });

  it('requests data export', () => {
    cy.intercept('POST', '/api/me/export', { statusCode: 202, body: { jobId: 'exp-1' } }).as('export');
    cy.findByRole('button', { name: /request data export/i }).click();
    cy.wait('@export');
    cy.contains(/we’ll email you|export requested|processing/i);
  });
});
