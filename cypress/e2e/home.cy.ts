describe('Home page smoke', () => {
  it('loads and shows something meaningful', () => {
    cy.visit('/')
    cy.contains(/mental health|search|login|services/i)
  })
})
