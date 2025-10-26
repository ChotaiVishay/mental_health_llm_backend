// cypress/e2e/perf.smoke.cy.ts
describe('Performance smoke (very light)', () => {
  it('home renders quickly (rough budget)', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        (win as any).marky = { mark: () => {}, stop: () => {} };
      },
    });
    cy.window().then((w: any) => {
      const perf = w.performance;
      const ttfb = perf.getEntriesByType('navigation')[0]?.responseStart || 0;
      expect(ttfb).to.be.greaterThan(0);
      // You can assert timing budgets if exposed (e.g., via /meta/build.json)
    });
  });
});
