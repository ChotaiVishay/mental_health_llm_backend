describe('Emergency guardrails (UI presence)', () => {
  it('shows crisis/helpline language somewhere', () => {
    cy.visit('/')
    cy.contains(/emergency|urgent help|lifeline|000|13 11 14/i)
  })
})
