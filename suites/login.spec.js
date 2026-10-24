// suites/login.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';

// Feature: Agrupa todos los escenarios de autenticación
feature('Autenticación en OrangeHRM', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-01] Inicio de sesión exitoso con credenciales válidas', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const ctx = {};

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa credenciales válidas', async () => {
      const credenciales = { username: 'Admin', password: 'admin123' };
      ctx.username = credenciales.username;
      await loginPage.login(credenciales.username, credenciales.password);
    });

    await then('el sistema redirige al dashboard principal', async () => {
      await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-02] Mostrar mensaje de error con usuario inválido', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const ctx = {};

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa un usuario inválido', async () => {
      await loginPage.login('usuarioNoValido', 'wrongpassword');
    });

    await then('el sistema muestra el mensaje de error "Invalid credentials"', async () => {
      const errorMessage = await loginPage.invalidCredentials();
      expect(errorMessage).toBe('Invalid credentials');
    });
  });

  // ==================== ESCENARIO 3 ====================
  scenario('[CP-03] Mostrar mensajes de error con campos vacíos', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('ingresa username vacío y password vacío', async () => {
      await loginPage.login('', '');
    });

    await then('el sistema debe mostrar 2 mensajes de campo requerido', async () => {
      await expect(loginPage.requiredMessages).toHaveCount(2);
    });
  });

  // ==================== ESCENARIO 4 ====================
  scenario('[CP-04] Validar enlace de "Forgot your password"', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await given('el usuario está en la página de login de OrangeHRM', async () => {
      await loginPage.goto();
    });

    await when('hace clic en el enlace "Forgot your password?"', async () => {
      await loginPage.forgotPassword.click();
    });

    await then('el sistema navega a la página de reset de password', async () => {
      await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/auth/requestPasswordResetCode');
    });
  });
});