// cypress/e2e/admin.directory.validation.cy.ts
describe('Admin: directory field validation', () => {
  beforeEach(() => {
    cy.setCookie('role', 'admin');
    cy.window().then(w => w.localStorage.setItem('sb:token', 'e2e-token'));
    cy.visit('/admin/listings/new');
  });

  it('requires key fields and saves valid listing', () => {
    cy.findByRole('button', { name: /save/i }).click();
    cy.contains(/required/i); // at least one

    cy.findByLabelText(/name/i).type('Calm Minds Clinic');
    cy.findByLabelText(/location|address/i).type('1 Collins St, Melbourne');
    cy.findByLabelText(/specialties/i).type('Anxiety{enter}');
    cy.findByLabelText(/modalities/i).type('CBT{enter}');
    cy.findByLabelText(/fees/i).type('$120');
    cy.findByLabelText(/telehealth/i).check();
    cy.findByLabelText(/languages/i).type('English{enter}');
    cy.findByLabelText(/hours/i).type('Mon–Fri 9–5');
    cy.findByLabelText(/availability/i).select('Open');

    cy.intercept('POST', '/api/listings', { statusCode: 201, body: { id: 123 } }).as('create');
    cy.findByRole('button', { name: /save/i }).click();
    cy.wait('@create');
    cy.url().should('match', /\/admin\/listings\/123/);
  });
});
