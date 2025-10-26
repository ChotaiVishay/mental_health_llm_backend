// cypress/e2e/security.headers.cy.ts
describe('Security headers', () => {
  it('sets common security headers', () => {
    cy.request('/').then((resp) => {
      const h = resp.headers;
      expect(h['strict-transport-security']).to.exist;
      expect(h['x-content-type-options']).to.include('nosniff');
      expect(h['referrer-policy']).to.exist;
      // CSP can vary by env
      expect(h).to.have.property('content-security-policy');
    });
  });
});
