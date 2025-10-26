// cypress/e2e/privacy.cy.ts
describe('Privacy hygiene', () => {
  it('does not put free-text query in the URL', () => {
    cy.visit('/');
    cy.findByRole('textbox').type('My name is John and I live at 12 King St{enter}');
    cy.location('search').should('eq', ''); // or only safe params
  });

  it('stores preferences under expected keys only', () => {
    cy.visit('/accessibility');
    cy.window().its('localStorage').invoke('keys').should((keys: string[]) => {
      expect(keys.filter(k => k.startsWith('support-atlas:preferences:')).length).to.be.greaterThan(0);
      // no raw chat logs in localStorage
      expect(keys.find(k => /chat|message|history/i.test(k))).to.be.undefined;
    });
  });
});
