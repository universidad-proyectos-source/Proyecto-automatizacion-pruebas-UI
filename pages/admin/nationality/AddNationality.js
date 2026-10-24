import { expect } from '@playwright/test';

export class AddNationality {
    constructor(page) {
        this.name = page.locator('.oxd-input-group:has(label:has-text("Name")) input');

        this.buttonCancel = page.locator('button:has-text("Cancel")');
        this.buttonSave = page.locator('button:has-text("Save")');

        this.confirmationToast = page.locator('.oxd-toast-container .oxd-toast--success');
        this.nameRequiredMessage = page.locator('.oxd-input-group:has(label:has-text("Name")) .oxd-input-field-error-message');
    }

    async fillForm(name) {
        await this.name.fill(name);
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
