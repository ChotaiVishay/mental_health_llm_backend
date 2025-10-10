describe('LLM search smoke', () => {
  it('accepts a query and shows some kind of results text/area', () => {
    cy.visit('/')
    cy.get('input, textarea').first().type('anxiety support{enter}')
    cy.contains(/result|services|therapist|near/i)
  })
})
