// suites/licenses.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddLicense } from '../pages/admin/qualifications/AddLicense.js';
import { uniqueName } from '../utils/testData.js';

feature('Administración de Licenses', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-17] Agregar un nuevo License correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addLicense = new AddLicense(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Licenses', async () => {
      await topbar.selectComboOption('Qualifications', 'Licenses');
    });

    await and('inicia la creación de un nuevo License', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addLicense.fillForm(uniqueName('AutoLic'));
    });

    await and('guarda el nuevo registro', async () => {
      await addLicense.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addLicense.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-18] Intentar agregar un License con campo obligatorio vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addLicense = new AddLicense(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Licenses', async () => {
      await topbar.selectComboOption('Qualifications', 'Licenses');
    });

    await and('inicia la creación de un nuevo License', async () => {
      await userManagement.clickAddRecord();
    });

    await and('intenta guardar el registro dejando el campo Name vacío', async () => {
      await addLicense.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de error indicando que el campo es requerido', async () => {
      await expect(addLicense.nameRequiredMessage).toBeVisible();
    });
  });
});
