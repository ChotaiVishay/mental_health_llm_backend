// cypress/e2e/legal.consent.cy.ts
describe('Consent before chat', () => {
  it('requires consent to proceed', () => {
    cy.clearLocalStorage();
    cy.visit('/chat');
    cy.contains(/consent|scope|limitations/i);
    cy.findByRole('button', { name: /accept/i }).click();

    cy.window()
      .its('localStorage')
      .invoke('getItem', 'support-atlas:consent')
      .should('match', /{"accepted":true,"timestamp":".+"}/);

    cy.contains(/start chat|message/i);
  });

  it('decline sends me back to home', () => {
    cy.visit('/chat');
    cy.findByRole('button', { name: /decline/i }).click();
    cy.url().should('match', /\/(home|)$/);
  });
});
