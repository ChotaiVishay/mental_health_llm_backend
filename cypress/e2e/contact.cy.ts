describe('Contact page', () => {
  it('lists phone, email, and crisis information', () => {
    cy.visit('/contact');

    cy.contains('Contact Support Atlas').should('be.visible');
    cy.contains('a', '1300 000 111').should('have.attr', 'href', 'tel:+611300000111');
    cy.contains('a', 'hello@supportatlas.org')
      .should('have.attr', 'href', 'mailto:hello@supportatlas.org');

    cy.contains(/Need crisis support\?/i).should('be.visible');
    cy.contains(/Lifeline/i).should('be.visible');
  });
});
