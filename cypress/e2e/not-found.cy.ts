describe('Not found page', () => {
  it('shows a helpful 404 when the route does not exist', () => {
    cy.visit('/this-route-does-not-exist', { failOnStatusCode: false });

    cy.contains('Page not found').should('be.visible');
    cy.get('.nf-code').should('contain.text', '404');
    cy.contains('.nf-path', '/this-route-does-not-exist').should('be.visible');

    cy.contains('a', /back to home/i).click();
    cy.url().should('match', /\/$/);
  });
});
