// cypress/e2e/help.contact.cy.ts
describe('Help centre contact', () => {
  it('submits enquiry and confirms', () => {
    cy.intercept('POST', '/api/help/contact', { statusCode: 200, body: { id: 1 } }).as('contact');
    cy.visit('/help');
    cy.findByLabelText(/your email/i).type('user@example.com');
    cy.findByLabelText(/message/i).type('Just testing');
    cy.findByRole('button', { name: /submit/i }).click();
    cy.wait('@contact');
    cy.contains(/thanks|we received your message/i);
  });
});
