// suites/nationalities.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddNationality } from '../pages/admin/nationality/AddNationality.js';
import { uniqueName } from '../utils/testData.js';

feature('Administración de Nationalities', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-19] Agregar una nueva Nationality correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addNationality = new AddNationality(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la sección Nationalities', async () => {
      await topbar.selectTab('Nationalities');
    });

    await and('inicia la creación de una nueva Nationality', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addNationality.fillForm(uniqueName('AutoNat'));
    });

    await and('guarda el nuevo registro', async () => {
      await addNationality.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addNationality.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-20] Intentar agregar una Nationality con campo obligatorio vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addNationality = new AddNationality(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la sección Nationalities', async () => {
      await topbar.selectTab('Nationalities');
    });

    await and('inicia la creación de una nueva Nationality', async () => {
      await userManagement.clickAddRecord();
    });

    await and('intenta guardar el registro dejando el campo Name vacío', async () => {
      await addNationality.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de error indicando que el campo es requerido', async () => {
      await expect(addNationality.nameRequiredMessage).toBeVisible();
    });
  });
});
