describe('Chat assistant', () => {
  it('sends a message and shows the response from the API', () => {
    cy.intercept('POST', '**/api/v1/chat/chat', {
      statusCode: 200,
      body: {
        response: 'This is a stubbed reply with available services.',
        session_id: 'session-123',
      },
    }).as('chatRequest');

    cy.visit('/chat');

    cy.get('#chat-input').type('I need counselling support');
    cy.contains('button', /^send$/i).click();

    cy.get('.msg.user .msg-text').contains('I need counselling support').should('be.visible');

    cy.wait('@chatRequest').its('request.body').should((body) => {
      expect(body).to.have.property('message', 'I need counselling support');
    });

    cy.get('.msg.assistant .msg-text')
      .contains('This is a stubbed reply with available services.')
      .should('be.visible');
  });
});
