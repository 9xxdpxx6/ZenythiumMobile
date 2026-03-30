/**
 * Минимальный smoke: корень приложения редиректит на экран входа.
 * Запуск: поднять dev-сервер (npm run dev), затем npm run test:e2e
 */
describe('App smoke', () => {
  it('shows login screen at root URL', () => {
    cy.visit('/');
    cy.contains('Добро пожаловать');
  });
});
