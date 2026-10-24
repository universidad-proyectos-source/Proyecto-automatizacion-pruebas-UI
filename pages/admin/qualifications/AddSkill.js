import { expect } from '@playwright/test';

export class AddSkill {
    constructor(page) {
        this.name = page.locator('.oxd-input-group:has(label:has-text("Name")) input');
        this.description = page.locator('textarea[placeholder="Type description here"]');

        this.buttonCancel = page.locator('button:has-text("Cancel")');
        this.buttonSave = page.locator('button:has-text("Save")');

        this.confirmationToast = page.locator('.oxd-toast-container .oxd-toast--success');
        this.nameRequiredMessage = page.locator('.oxd-input-group:has(label:has-text("Name")) .oxd-input-field-error-message');
    }

    async fillForm(name, description) {
        await this.name.fill(name);
        if (description) await this.description.fill(description);
    }

    async clickSave() {
        await this.buttonSave.click();
    }

    async clickCancel() {
        await this.buttonCancel.click();
    }

    async validateSuccessMessage() {
        await expect(this.confirmationToast).toBeVisible();
        await expect(this.confirmationToast).toHaveText(/Successfully Saved/);
    }
}
