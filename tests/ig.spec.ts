import * as dotenv from 'dotenv';
import { test } from '@playwright/test';

dotenv.config();

const USER_EMAIL = process.env.USER_EMAIL ?? "";
const USER_PASSWORD = process.env.USER_PASSWORD ?? "";

test.setTimeout(60000);

test('click like button', async ({ page }) => {
  await page.goto('https://www.instagram.com/');

  await page.getByLabel('Phone number, username, or').click();
  await page.getByLabel('Phone number, username, or').fill(USER_EMAIL);
  await page.getByLabel('Password').click();
  await page.getByLabel('Password').fill(USER_PASSWORD);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await page.getByRole('button', { name: 'Not now' }).click();
  await page.getByRole('button', { name: 'Not Now' }).click();

  while (true) {
    await page.getByLabel(/Story by .+/i).first().click();
    for (let i = 0; i < 10; i++) {
      await page.getByRole('button', { name: 'Like' }).first().click();
      await page.getByLabel('Next').first().click();
      await page.waitForTimeout(1000);
    }
    await page.goto('https://www.instagram.com/');
    for (let i = 0; i < 10; i++) {
      await (async () => {
        for (const row of await page.getByRole('button', { name: 'Like' }).all()) {
          await row.click();
          await page.waitForTimeout(1000);
        }
        await page.reload();
        await page.waitForTimeout(5000);
      })();
    }
    await page.reload();
  }
});

