// cypress/e2e/admin.users.crud.cy.ts
describe('Admin: users CRUD', () => {
  beforeEach(() => {
    cy.setCookie('role', 'admin');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/users');
  });

  it('creates a user', () => {
    cy.intercept({ method: 'POST', url: '**/auth/v1/admin/users' }, { statusCode: 201, body: { user: { id: '999', email: 'new@ex.com', role: 'user' } } }).as('create');
    cy.findByRole('button', { name: /new user/i }).click();
    cy.findByLabelText(/email/i).type('new@ex.com');
    cy.findByLabelText(/role/i).select('User');
    cy.findByRole('button', { name: /save/i }).click();
    cy.wait('@create');
    cy.contains(/new@ex.com/i);
  });

  it('deactivates and deletes a user', () => {
    cy.intercept({ method: 'PATCH', url: '**/auth/v1/admin/users/**' }, { statusCode: 200, body: { user: { id: '999', is_active: false } } }).as('deactivate');
    cy.findByRole('button', { name: /deactivate/i }).first().click();
    cy.wait('@deactivate');
    cy.contains(/inactive/i);

    cy.intercept({ method: 'DELETE', url: '**/auth/v1/admin/users/**' }, { statusCode: 200 }).as('delete');
    cy.findByRole('button', { name: /delete/i }).first().click();
    cy.findByRole('button', { name: /confirm/i }).click();
    cy.wait('@delete');
  });
});
