// suites/skills.spec.js
import { test, expect } from '@playwright/test';
import { given, when, then, and, feature, scenario } from 'gherkin-lite';
import { LoginPage } from '../pages/login/LoginPage.js';
import { SidebarComponent } from '../pages/common/sidebarcomponent.js';
import { TopbarComponent } from '../pages/common/TopbarComponent.js';
import { UserManagementPage } from '../pages/admin/user_management/UserManagementPage.js';
import { AddSkill } from '../pages/admin/qualifications/AddSkill.js';
import { uniqueName } from '../utils/testData.js';

feature('Administración de Skills', () => {

  // ==================== ESCENARIO 1 ====================
  scenario('[CP-13] Agregar un nuevo Skill correctamente', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addSkill = new AddSkill(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Skills', async () => {
      await topbar.selectComboOption('Qualifications', 'Skills');
    });

    await and('inicia la creación de un nuevo Skill', async () => {
      await userManagement.clickAddRecord();
    });

    await and('completa el formulario con datos válidos', async () => {
      await addSkill.fillForm(uniqueName('AutoSkill'), 'QA Skill');
    });

    await and('guarda el nuevo registro', async () => {
      await addSkill.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de éxito', async () => {
      await addSkill.validateSuccessMessage();
    });
  });

  // ==================== ESCENARIO 2 ====================
  scenario('[CP-14] Intentar agregar un Skill con campo obligatorio vacío', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const sidebar = new SidebarComponent(page);
    const topbar = new TopbarComponent(page);
    const userManagement = new UserManagementPage(page);
    const addSkill = new AddSkill(page);

    await given('el usuario administrador está autenticado en el sistema', async () => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
    });

    await when('navega a la sección de Admin', async () => {
      await sidebar.selectOption('Admin');
    });

    await and('accede a la subsección Skills', async () => {
      await topbar.selectComboOption('Qualifications', 'Skills');
    });

    await and('inicia la creación de un nuevo Skill', async () => {
      await userManagement.clickAddRecord();
    });

    await and('intenta guardar el registro dejando el campo Name vacío', async () => {
      await addSkill.clickSave();
    });

    await then('el sistema debe mostrar un mensaje de error indicando que el campo es requerido', async () => {
      await expect(addSkill.nameRequiredMessage).toBeVisible();
    });
  });
});
