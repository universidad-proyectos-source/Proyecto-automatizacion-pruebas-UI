// suites/locations.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddLocation } from '../pages/admin/organization/AddLocation.js';
import { uniqueName } from '../utils/testData.js';

feature('Administración de Locations', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-11] Agregar una nueva Location correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addLocation = new AddLocation(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Locations', async () => {
      await topbar.selectComboOption('Organization', 'Locations');
    });

    await and('inicia la creación de una nueva Location', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addLocation.fillForm({
        name: uniqueName('AutoLoc'),
        city: 'Bogotá',
        country: 'Colombia'
      });
    });

    await and('guarda el nuevo registro', async () => {
      await addLocation.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addLocation.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-12] Intentar agregar una Location con campos obligatorios vacíos', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addLocation = new AddLocation(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Locations', async () => {
      await topbar.selectComboOption('Organization', 'Locations');
    });

    await and('inicia la creación de una nueva Location', async () => {
      await userManagement.clickAddRecord();
    });

    await and('intenta guardar el registro dejando Name y Country vacíos', async () => {
      await addLocation.clickSave();
    });

    await then('el sistema debe mostrar mensajes de error indicando que los campos son requeridos', async () => {
      await expect(addLocation.nameRequiredMessage).toBeVisible();
      await expect(addLocation.countryRequiredMessage).toBeVisible();
    });
  });
});
