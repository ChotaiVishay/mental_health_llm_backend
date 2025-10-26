describe('Language switcher', () => {
  it('changes language and persists after reload', () => {
    cy.visit('/');

    cy.contains('Find mental-health support, fast.').should('be.visible');

    cy.get('select[aria-label="Language"]').select('es');

    cy.contains('Encuentra apoyo en salud mental').should('be.visible');

    cy.reload();
    cy.contains('Encuentra apoyo en salud mental').should('be.visible');
  });
});
