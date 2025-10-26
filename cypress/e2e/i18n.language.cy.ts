// cypress/e2e/i18n.language.cy.ts
describe('Language switcher', () => {
  it('changes language and persists', () => {
    cy.visit('/');
    cy.findByRole('button', { name: /language/i }).click();
    cy.findByRole('menuitem', { name: /español|hindi|简体中文|العربية|français/i }).click();

    // Assert a known string is translated
    cy.contains(/iniciar sesión|connexion|登录|تسجيل|se connecter/i);

    cy.reload();
    cy.contains(/iniciar sesión|connexion|登录|تسجيل|se connecter/i);
  });
});
