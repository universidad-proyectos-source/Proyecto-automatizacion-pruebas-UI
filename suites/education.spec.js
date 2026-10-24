// suites/education.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddEducation } from '../pages/admin/qualifications/AddEducation.js';
import { uniqueName } from '../utils/testData.js';

feature('Administración de Education', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-15] Agregar un nuevo nivel de Education correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addEducation = new AddEducation(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Education', async () => {
      await topbar.selectComboOption('Qualifications', 'Education');
    });

    await and('inicia la creación de un nuevo nivel de Education', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addEducation.fillForm(uniqueName('AutoEdu'));
    });

    await and('guarda el nuevo registro', async () => {
      await addEducation.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addEducation.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-16] Intentar agregar un nivel de Education con campo obligatorio vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addEducation = new AddEducation(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Education', async () => {
      await topbar.selectComboOption('Qualifications', 'Education');
    });

    await and('inicia la creación de un nuevo nivel de Education', async () => {
      await userManagement.clickAddRecord();
    });

    await and('intenta guardar el registro dejando el campo Level vacío', async () => {
      await addEducation.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de error indicando que el campo es requerido', async () => {
      await expect(addEducation.levelRequiredMessage).toBeVisible();
    });
  });
});
