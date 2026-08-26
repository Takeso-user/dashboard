import { test, expect } from '@playwright/test';

test.describe('Roadmap Dynamic Table Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display Roadmap title and metrics', async ({ page }) => {
    const title = page.locator('#main-roadmap-title');
    await expect(title).toBeVisible();
    await expect(title).toContainText('Roadmap');

    const overallPct = page.locator('#metric-overall-pct');
    await expect(overallPct).toBeVisible();

    const table = page.locator('#roadmap-table');
    await expect(table).toBeVisible();
  });

  test('should handle cell checkbox toggles and update metrics', async ({ page }) => {
    // Locate the first active cell checkbox
    const firstCheckbox = page.locator('.cell-checkbox').first();
    await expect(firstCheckbox).toBeVisible();

    const initialChecked = await firstCheckbox.isChecked();
    // Toggle state
    await firstCheckbox.click();
    expect(await firstCheckbox.isChecked()).toBe(!initialChecked);

    // Verify percentage badge reflects change
    const badge = page.locator('.cell-percent-badge').first();
    if (!initialChecked) {
      await expect(badge).toHaveText('100%');
    } else {
      await expect(badge).toHaveText('0%');
    }
  });

  test('should toggle cell to N/A on right-click and restore on second right-click', async ({ page }) => {
    const firstCell = page.locator('.roadmap-cell').first();
    await expect(firstCell).toBeVisible();

    // Right-click on cell
    await firstCell.click({ button: 'right' });

    // Cell should now have N/A badge
    const naBadge = firstCell.locator('.na-badge');
    await expect(naBadge).toBeVisible();
    await expect(naBadge).toHaveText('N/A');

    // Right-click again to restore
    await firstCell.click({ button: 'right' });

    // Cell should now have checkbox and percentage badge
    const checkbox = firstCell.locator('.cell-checkbox');
    await expect(checkbox).toBeVisible();
    const pctBadge = firstCell.locator('.cell-percent-badge');
    await expect(pctBadge).toBeVisible();
  });

  test('should toggle edit mode to lock/unlock table structure', async ({ page }) => {
    const btnToggleEdit = page.locator('#btn-toggle-edit');
    const btnAddCol = page.locator('#btn-add-col');
    const btnAddRow = page.locator('#btn-add-row');

    // Initially in view mode, add buttons should be hidden
    await expect(btnAddCol).toBeHidden();
    await expect(btnAddRow).toBeHidden();

    // Click toggle to enter Edit Mode
    await btnToggleEdit.click();
    await expect(page.locator('body')).toHaveClass(/edit-mode/);
    await expect(btnAddCol).toBeVisible();
    await expect(btnAddRow).toBeVisible();

    // Click toggle again to Lock Structure
    await btnToggleEdit.click();
    await expect(page.locator('body')).not.toHaveClass(/edit-mode/);
    await expect(btnAddCol).toBeHidden();
    await expect(btnAddRow).toBeHidden();
  });

  test('should dynamically add columns and rows in edit mode', async ({ page }) => {
    // Enter Edit Mode
    await page.locator('#btn-toggle-edit').click();

    const initialColCount = await page.locator('#roadmap-table-header th[data-col-id]').count();
    const initialRowCount = await page.locator('#roadmap-table-body tr').count();

    // Add a new column
    await page.locator('#btn-add-col').click();
    const newColCount = await page.locator('#roadmap-table-header th[data-col-id]').count();
    expect(newColCount).toBe(initialColCount + 1);

    // Add a new row
    await page.locator('#btn-add-row').click();
    const newRowCount = await page.locator('#roadmap-table-body tr').count();
    expect(newRowCount).toBe(initialRowCount + 1);
  });

  test('should allow setting percentage via percentage popover', async ({ page }) => {
    const badge = page.locator('.cell-percent-badge').first();
    await badge.click();

    // Popover should appear with options
    const popover = page.locator('.percentage-popover');
    await expect(popover).toBeVisible();

    // Click 50%
    const btn50 = popover.locator('button', { hasText: '50%' });
    await btn50.click();

    // Badge should now display 50%
    await expect(badge).toHaveText('50%');
  });

  test('should persist data to JSON endpoint when clicking Save', async ({ page }) => {
    const saveBtn = page.locator('#btn-save-db');
    await expect(saveBtn).toBeVisible();

    const [response] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/roadmap') && res.request().method() === 'POST'),
      saveBtn.click(),
    ]);

    expect(response.status()).toBe(200);
    const json = await response.json();
    expect(json.success).toBe(true);

    const toast = page.locator('.toast');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Roadmap saved');
  });
});
