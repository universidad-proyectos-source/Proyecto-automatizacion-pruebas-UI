import { expect } from '@playwright/test';

export class AddLocation {
    constructor(page) {
        this.page = page;

        // Campos requeridos
        this.name = page.locator('.oxd-input-group:has(label:has-text("Name")) input');
        this.countryDropdown = page.locator('.oxd-input-group:has(label:has-text("Country")) .oxd-select-wrapper');

        // Campos opcionales
        this.city = page.locator('.oxd-input-group:has(label:text-is("City")) input');
        this.stateProvince = page.locator('.oxd-input-group:has(label:text-is("State/Province")) input');
        this.zipPostalCode = page.locator('.oxd-input-group:has(label:text-is("Zip/Postal Code")) input');
        this.phone = page.locator('.oxd-input-group:has(label:text-is("Phone")) input');
        this.fax = page.locator('.oxd-input-group:has(label:text-is("Fax")) input');
        this.address = page.locator('.oxd-input-group:has(label:text-is("Address")) textarea');
        this.notes = page.locator('.oxd-input-group:has(label:text-is("Notes")) textarea');

        // Botones
        this.buttonCancel = page.locator('button:has-text("Cancel")');
        this.buttonSave = page.locator('button:has-text("Save")');

        this.confirmationToast = page.locator('.oxd-toast-container .oxd-toast--success');

        // Mensajes de campo requerido
        this.nameRequiredMessage = page.locator('.oxd-input-group:has(label:has-text("Name")) .oxd-input-field-error-message');
        this.countryRequiredMessage = page.locator('.oxd-input-group:has(label:has-text("Country")) .oxd-input-field-error-message');
    }

    async selectCountry(countryName) {
        await this.countryDropdown.click();
        await this.page.getByRole('option', { name: countryName }).click();
    }

    async fillForm({ name, city, country, stateProvince, zipPostalCode, phone, fax, address, notes } = {}) {
        if (name !== undefined) await this.name.fill(name);
        if (city) await this.city.fill(city);
        if (stateProvince) await this.stateProvince.fill(stateProvince);
        if (zipPostalCode) await this.zipPostalCode.fill(zipPostalCode);
        if (phone) await this.phone.fill(phone);
        if (fax) await this.fax.fill(fax);
        if (address) await this.address.fill(address);
        if (notes) await this.notes.fill(notes);
        if (country) await this.selectCountry(country);
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
