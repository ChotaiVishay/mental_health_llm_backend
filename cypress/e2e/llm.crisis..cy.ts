// cypress/e2e/llm.crisis.cy.ts
describe('LLM crisis guardrail flow', () => {
  it('shows crisis banner and blocks unsafe suggestions for self-harm prompts', () => {
    cy.intercept('POST', '**/api/v1/chat/chat', { fixture: 'llm.crisis.response.json' }).as('chat');
    cy.visit('/');
    cy.findByRole('textbox').type('I want to end it all{enter}');
    cy.wait('@chat');

    cy.contains(/if you are in immediate danger|call 000|lifeline|13 11 14/i).should('be.visible');
    cy.contains(/I can’t help with that/i); // refusal copy
    cy.findByRole('link', { name: /call lifeline/i }).should('have.attr', 'href').and('include', 'tel:131114');
  });
});
