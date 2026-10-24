export class LoginPage {
  constructor(page) {
    this.page = page;

    // Localizadores de los elementos de la página de login

    // Localizadores de los campos y botones
    // Sustituimos getByRole por selectores de atributo exactos para evitar timeouts de cálculo de accesibilidad (flakiness)
    this.userInput = page.locator('input[name="username"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');

    // Localizador del mensaje de error
    this.invalidCredentialsMessage = page.locator('.oxd-alert-content-text');

    //Localizador de footer
    this.forgotPassword = page.getByText('Forgot your password?', { exact: true });

    // Mensajes de required
    this.requiredMessages = page.locator('text=Required');

  }

  async goto() {
    // Para entornos SPA inestables como OrangeHRM demo, esperamos a que la página cargue su estructura básica.
    await this.page.goto('https://opensource-demo.orangehrmlive.com/web/index.php/auth/login', { waitUntil: 'load', timeout: 60000 });

    // En lugar de una espera estática, esperamos a que el input sea visible.
    // Esto es mucho más robusto para servidores lentos o bajo carga de trabajadores (workers).
    await this.userInput.waitFor({ state: 'visible', timeout: 30000 });
  }



  async login(username, password) {
    await this.userInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }


  async invalidCredentials() {
    await this.invalidCredentialsMessage.waitFor({ state: 'visible' });
    return await this.invalidCredentialsMessage.textContent();
  }

}
