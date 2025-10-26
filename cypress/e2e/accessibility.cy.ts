describe('Accessibility preferences page', () => {
  const modes = [
    {
      label: /easy mode/i,
      attr: 'data-easy-mode',
      storageKey: 'support-atlas:preferences:easy-mode',
    },
    {
      label: /high contrast/i,
      attr: 'data-high-contrast',
      storageKey: 'support-atlas:preferences:high-contrast-mode',
    },
    {
      label: /large text/i,
      attr: 'data-large-text',
      storageKey: 'support-atlas:preferences:large-text-mode',
    },
    {
      label: /dyslexia-friendly mode/i,
      attr: 'data-dyslexic-mode',
      storageKey: 'support-atlas:preferences:dyslexic-mode',
    },
    {
      label: /reduce motion/i,
      attr: 'data-reduced-motion',
      storageKey: 'support-atlas:preferences:reduced-motion-mode',
    },
    {
      label: /screen reader assist/i,
      attr: 'data-screen-reader-assist',
      storageKey: 'support-atlas:preferences:screen-reader-mode',
    },
  ] as const;

  beforeEach(() => {
    cy.clearLocalStorage();
    cy.visit('/accessibility');
  });

  modes.forEach(({ label, attr, storageKey }) => {
    it(`toggles ${storageKey}`, () => {
      cy.contains('button', label).as('toggle');

      cy.get('@toggle').should('have.attr', 'aria-pressed', 'false');
      cy.get('html').should('have.attr', attr, 'off');

      cy.get('@toggle').click();

      cy.get('@toggle').should('have.attr', 'aria-pressed', 'true');
      cy.get('html').should('have.attr', attr, 'on');
      cy.window().its('localStorage').invoke('getItem', storageKey).should('eq', 'on');

      cy.reload();

      cy.contains('button', label).should('have.attr', 'aria-pressed', 'true');
      cy.get('html').should('have.attr', attr, 'on');

      cy.contains('button', label).click();

      cy.contains('button', label).should('have.attr', 'aria-pressed', 'false');
      cy.get('html').should('have.attr', attr, 'off');
      cy.window().its('localStorage').invoke('getItem', storageKey).should('eq', 'off');
    });
  });
});
