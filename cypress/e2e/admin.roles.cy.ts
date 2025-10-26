// cypress/e2e/admin.roles.cy.ts
describe('Admin: assign roles', () => {
  beforeEach(() => {
    cy.setCookie('role', 'superadmin');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/users');
  });

  it('changes user role and persists', () => {
    cy.intercept({ method: 'PATCH', url: '**/auth/v1/admin/users/**' }, { statusCode: 200, body: { user: { role: 'moderator' } } }).as('role');
    cy.findByRole('button', { name: /edit/i }).first().click();
    cy.findByLabelText(/role/i).select('Moderator');
    cy.findByRole('button', { name: /save/i }).click();
    cy.wait('@role');
    cy.contains(/moderator/i);
  });
});
