import { expect, test } from "@playwright/test";
import { AuthPage } from "../pages/auth.page";
import { authenticateUser } from "../helpers/auth";
import { waitForPageLoad } from "../setup/test-helpers";

test.describe("Authentication - Change Password", () => {
  test("allows an authenticated user to rotate password and sign back in", async ({
    page,
  }) => {
    const oldPassword = "ChangePwd1234!";
    const newPassword = "UpdatedPwd5678!";

    const user = await authenticateUser(page, {
      name: "Change Password User",
      password: oldPassword,
    });

    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);
    await expect(page.getByTestId("user-profile-card")).toBeVisible();

    await page.getByTestId("profile-menu-button").click();
    await page
      .getByTestId("profile-change-password")
      .click();

    await page.getByTestId("change-password-current").fill(oldPassword);
    await page.getByTestId("change-password-new").fill(newPassword);
    await page.getByTestId("change-password-confirm").fill(newPassword);
    await page.getByTestId("change-password-submit").click();

    await page.waitForURL("**/signin", { timeout: 15000 });
    const authPage = new AuthPage(page);
    await expect(authPage.signInForm).toBeVisible();

    await authPage.signIn(user.email, newPassword);
    await page.waitForURL("**/app", { timeout: 15000 });

    await page.goto("/en-US/app/profile");
    await waitForPageLoad(page);
    await expect(page.getByTestId("user-profile-card")).toBeVisible();
  });
});
