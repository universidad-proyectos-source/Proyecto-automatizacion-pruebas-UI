import { expect } from '@playwright/test';

export class AddEducation {
    constructor(page) {
        this.level = page.locator('.oxd-input-group:has(label:has-text("Level")) input');

        this.buttonCancel = page.locator('button:has-text("Cancel")');
        this.buttonSave = page.locator('button:has-text("Save")');

        this.confirmationToast = page.locator('.oxd-toast-container .oxd-toast--success');
        this.levelRequiredMessage = page.locator('.oxd-input-group:has(label:has-text("Level")) .oxd-input-field-error-message');
    }

    async fillForm(level) {
        await this.level.fill(level);
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
