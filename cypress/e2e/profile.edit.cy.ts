// cypress/e2e/profile.edit.cy.ts
describe('Profile: edit', () => {
  beforeEach(() => {
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/profile');
  });

  it('updates username and persists', () => {
    cy.intercept('PATCH', '/api/me', { statusCode: 200, body: { username: 'New Name' } }).as('save');
    cy.findByLabelText(/username/i).clear().type('New Name');
    cy.findByRole('button', { name: /save/i }).click();
    cy.wait('@save');
    cy.contains(/new name/i);
  });
});
