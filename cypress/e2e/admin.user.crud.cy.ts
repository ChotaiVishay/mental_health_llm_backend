// cypress/e2e/admin.users.crud.cy.ts
describe('Admin: users CRUD', () => {
  beforeEach(() => {
    cy.setCookie('role', 'admin');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/users');
  });

  it('creates a user', () => {
    cy.intercept('POST', '/api/users', { statusCode: 201, body: { id: 999, email: 'new@ex.com', role: 'user' } }).as('create');
    cy.findByRole('button', { name: /new user/i }).click();
    cy.findByLabelText(/email/i).type('new@ex.com');
    cy.findByLabelText(/role/i).select('User');
    cy.findByRole('button', { name: /save/i }).click();
    cy.wait('@create');
    cy.contains(/new@ex.com/i);
  });

  it('deactivates and deletes a user', () => {
    cy.intercept('PATCH', '/api/users/*', { statusCode: 200, body: { active: false } }).as('deactivate');
    cy.findByRole('button', { name: /deactivate/i }).first().click();
    cy.wait('@deactivate');
    cy.contains(/inactive/i);

    cy.intercept('DELETE', '/api/users/*', { statusCode: 204 }).as('delete');
    cy.findByRole('button', { name: /delete/i }).first().click();
    cy.findByRole('button', { name: /confirm/i }).click();
    cy.wait('@delete');
  });
});
