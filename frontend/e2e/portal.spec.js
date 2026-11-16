import { test, expect } from "@playwright/test";

test("public portal and internship search load from the running API", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Launch your next opportunity" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Explore Internships" })).toBeVisible();
  await expect(page.getByRole("searchbox", { name: "Search role or company" })).toBeVisible();
});

test("a student can register and sign in through the browser", async ({ page }) => {
  const unique = Date.now() + "-" + Math.floor(Math.random() * 100000);
  const email = "portal-e2e-" + unique + "@example.com";
  const srn = "E2E" + unique;

  await page.goto("/");
  await page.getByRole("button", { name: "New here? Create an account" }).click();

  await page.locator("#account-name").fill("E2E Test Student");
  await page.locator("#account-email").fill(email);
  await page.locator("#account-srn").fill(srn);
  await page.locator("#account-password").fill("PortalTest123");

  const registration = page.waitForResponse(response =>
    response.url().includes("/auth/register/student") && response.request().method() === "POST"
  );
  await page.locator("form").getByRole("button", { name: "Register", exact: true }).click();
  expect((await registration).ok()).toBeTruthy();

  await expect(page.getByRole("status")).toContainText(/student|registered|created/i);
  await page.locator("#account-password").fill("PortalTest123");

  const login = page.waitForResponse(response =>
    response.url().includes("/auth/login") && response.request().method() === "POST"
  );
  await page.getByRole("button", { name: "Sign in" }).click();
  expect((await login).ok()).toBeTruthy();

  await expect(page.locator(".portal-account")).toContainText("Signed in as E2E Test Student (student)");
  await expect(page.getByRole("link", { name: "My dashboard" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Aptitude practice" })).toBeVisible();
});
