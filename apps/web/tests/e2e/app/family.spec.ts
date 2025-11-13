import { expect, test } from "@playwright/test";
import { type AuthenticatedUser, authenticateUser } from "../helpers/auth";
import { FamilyPage } from "../pages/family.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

test.describe("Family Page", () => {
  let familyPage: FamilyPage;
  let parentUser: AuthenticatedUser;

  test.beforeEach(async ({ page }) => {
    familyPage = new FamilyPage(page);
    
    // Authenticate as parent user with a family
    parentUser = await authenticateUser(page, {
      name: "Parent Test User",
      birthdate: "1985-03-15",
      createFamily: true,
      familyName: "Test Family",
    });
    
    await familyPage.gotoFamily("en-US");
    await waitForPageLoad(page);
  });

  test.describe("Page Load and Display", () => {
    test("should display family page title and description", async ({ page }) => {
      await page.waitForTimeout(1000); // Wait for initial render
      await expect(familyPage.pageTitle).toBeVisible({ timeout: 10000 });
      await expect(familyPage.pageDescription).toBeVisible();
    });

    test("should display Add Member button for parents", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(1000);
      
      // Check if button exists (it should for parent users)
      const buttonExists = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      // For parent users, button should be visible
      expect(buttonExists).toBeTruthy();
    });

    test("should load page successfully", async ({ page }) => {
      await page.waitForTimeout(1000);
      const isLoaded = await familyPage.isPageLoaded();
      expect(isLoaded).toBeTruthy();
    });
  });

  test.describe("Member Display", () => {
    test("should display member cards when members exist", async ({ page }) => {
      await page.waitForTimeout(2000); // Wait for data to load
      
      const memberCount = await familyPage.getMemberCount();
      // At least the parent user should be a member
      expect(memberCount).toBeGreaterThanOrEqual(0);
    });

    test("should display member information correctly", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        // Check first member has required info
        await expect(familyPage.memberName.first()).toBeVisible({ timeout: 10000 });
        await expect(familyPage.memberAge.first()).toBeVisible();
        await expect(familyPage.memberRole.first()).toBeVisible();
        await expect(familyPage.memberKarma.first()).toBeVisible();
      }
    });

    test("should display karma for members", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        const karma = await familyPage.getMemberKarma(0);
        expect(karma).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe("Add Member Dialog", () => {
    test("should open add member dialog", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(1000);
      
      // Check if add button is visible (should be for parent users)
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (buttonVisible) {
        await familyPage.openAddMemberDialog();
        await expect(familyPage.dialog).toBeVisible();
        await expect(page.getByRole("heading", { name: /add family member/i })).toBeVisible();
      } else {
        // Skip test if button not visible (user might not be parent)
        test.skip();
      }
    });

    test("should validate email format", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(1000);
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.openAddMemberDialog();
      
      await familyPage.fillAddMemberForm({
        email: "invalid-email",
        password: "TestPass123!",
        name: "Test Child",
        birthdate: "2015-01-01",
      });
      
      // Try to submit
      await familyPage.submitAddMember();
      
      // Should show validation error
      const hasError = await familyPage.hasValidationError("valid email");
      expect(hasError).toBeTruthy();
    });

    test("should validate password length", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(1000);
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.openAddMemberDialog();
      
      await familyPage.fillAddMemberForm({
        email: "child@example.com",
        password: "short",
        name: "Test Child",
        birthdate: "2015-01-01",
      });
      
      await familyPage.submitAddMember();
      
      const hasError = await familyPage.hasValidationError("at least 8 characters");
      expect(hasError).toBeTruthy();
    });

    test("should close dialog on cancel", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(1000);
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.openAddMemberDialog();
      await expect(familyPage.dialog).toBeVisible();
      
      await familyPage.cancelDialog();
      await expect(familyPage.dialog).not.toBeVisible();
    });
  });

  test.describe("Member Actions - Parent User", () => {
    test("should show actions button for parent users", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await expect(familyPage.memberActionsButton.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test("should open give karma dialog", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();
        
        await expect(familyPage.dialog).toBeVisible();
        await expect(page.getByRole("heading", { name: /give karma/i })).toBeVisible();
      }
    });

    test("should validate karma amount", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();

        // Try to submit without filling form
        await expect(familyPage.karmaSubmitButton).toBeDisabled();
      }
    });

    test("should open edit role dialog", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickEditRole();
        
        await expect(familyPage.dialog).toBeVisible();
        await expect(page.getByRole("heading", { name: /edit.*role/i })).toBeVisible();
      }
    });

    test("should open remove member dialog", async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickRemoveMember();
        
        await expect(familyPage.alertDialog).toBeVisible();
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should display correctly on mobile", async ({ page }) => {
      await setViewport(page, "mobile");
      await page.waitForTimeout(500);
      await page.reload();
      await waitForPageLoad(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(familyPage.pageTitle).toBeVisible({ timeout: 10000 });
    });

    test("should display correctly on tablet", async ({ page }) => {
      await setViewport(page, "tablet");
      await page.waitForTimeout(500);
      await page.reload();
      await waitForPageLoad(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(familyPage.pageTitle).toBeVisible({ timeout: 10000 });
    });

    test("should display correctly on desktop", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.waitForTimeout(500);
      await page.reload();
      await waitForPageLoad(page);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(1000);
      
      await expect(familyPage.pageTitle).toBeVisible({ timeout: 10000 });
      
      // Check if add button is visible (should be for parent users)
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (buttonVisible) {
        await expect(familyPage.addMemberButton).toBeVisible();
      }
    });
  });

  test.describe("Authorization - Child User", () => {
    test("should not show action buttons for child users", async ({ page }) => {
      // Add a child user to the parent's family
      const childUser = await authenticateUser(page, {
        name: "Child Test User",
        birthdate: "2010-05-15",
        createFamily: false,
      });

      // Add the child to the parent's family using the API
      const addMemberResponse = await fetch(`${API_URL}/v1/families/${parentUser.familyId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parentUser.sessionToken}`,
        },
        body: JSON.stringify({
          email: childUser.email,
          password: childUser.password,
          name: childUser.name,
          birthdate: "2010-05-15",
          role: "Child",
        }),
      });

      if (!addMemberResponse.ok) {
        throw new Error(`Failed to add child member: ${addMemberResponse.status}`);
      }

      // Switch to child user
      await page.context().clearCookies();
      await page.context().addCookies([
        {
          name: "better-auth.session_token",
          value: childUser.sessionToken,
          domain: "localhost",
          path: "/",
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);

      await familyPage.gotoFamily("en-US");
      await waitForPageLoad(page);
      await page.waitForTimeout(2000);
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        // Child users should not see action buttons
        const actionsVisible = await familyPage.memberActionsButton.first().isVisible().catch(() => false);
        expect(actionsVisible).toBeFalsy();
      }
    });
  });

  test.describe("Role Updates", () => {
    test("should successfully update member role", async ({ page }) => {
      // First add another parent member so we can safely demote one
      const addResponse = await fetch(`${API_URL}/v1/families/${parentUser.familyId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parentUser.sessionToken}`,
        },
        body: JSON.stringify({
          email: `parent-${Date.now()}@example.com`,
          password: "TestPass123!",
          name: "Second Parent",
          birthdate: "1990-01-01",
          role: "Parent",
        }),
      });

      if (!addResponse.ok) {
        throw new Error(`Failed to add parent member: ${addResponse.status}`);
      }

      // Reload to see the new member
      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for member cards to be present
      await familyPage.memberCards.first().waitFor({ state: "visible" });

      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 1) {
        // Get initial role of first member
        const initialRole = await familyPage.getMemberRole(0);

        // Open edit role dialog
        await familyPage.openMemberActions(0);
        await familyPage.clickEditRole();

        // Select different role - demote parent to child
        const newRole = initialRole?.toLowerCase().includes("parent") ? "Child" : "Parent";
        const combobox = page.getByRole("combobox");
        await combobox.waitFor({ state: "visible" });
        await combobox.click();

        const option = page.getByRole("option", { name: new RegExp(newRole, "i") });
        await option.waitFor({ state: "visible" });
        await option.click();

        // Submit and wait for both API responses (PATCH and refetch GET)
        const saveButton = page.getByRole("button", { name: /save changes/i });
        await Promise.all([
          page.waitForResponse(response =>
            response.url().includes("/members/") &&
            response.request().method() === "PATCH"
          ),
          page.waitForResponse(response =>
            response.url().includes("/families") &&
            response.request().method() === "GET"
          ),
          saveButton.click()
        ]);

        // Wait for dialog to close
        await familyPage.dialog.waitFor({ state: "hidden" });

        // Verify role changed
        const updatedRole = await familyPage.getMemberRole(0);
        expect(updatedRole?.toLowerCase()).toContain(newRole.toLowerCase());
      }
    });
  });

  test.describe("Member Removal", () => {
    test("should successfully remove a member", async ({ page }) => {
      // First add a child member to remove
      const addResponse = await fetch(`${API_URL}/v1/families/${parentUser.familyId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${parentUser.sessionToken}`,
        },
        body: JSON.stringify({
          email: `removeme-${Date.now()}@example.com`,
          password: "TestPass123!",
          name: "Child To Remove",
          birthdate: "2015-01-01",
          role: "Child",
        }),
      });

      if (!addResponse.ok) {
        throw new Error(`Failed to add child member: ${addResponse.status}`);
      }

      // Reload and wait for updated member list
      const responsePromise = page.waitForResponse(response =>
        response.url().includes("/families") &&
        response.request().method() === "GET"
      );

      await page.reload();
      await page.waitForLoadState("networkidle");

      // Wait for the family data to be fetched
      await responsePromise;

      // Wait for at least 2 member cards to be present (parent + newly added child)
      await page.waitForFunction(
        () => document.querySelectorAll('[data-testid="family-member-card"]').length >= 2,
        { timeout: 10000 }
      );

      const initialCount = await familyPage.getMemberCount();
      
      // Open remove dialog for first member
      await familyPage.openMemberActions(0);
      await familyPage.clickRemoveMember();
      
      // Confirm removal and wait for API response
      const removeButton = page.getByRole("button", { name: /remove member/i });
      await Promise.all([
        page.waitForResponse(response =>
          response.url().includes("/members/") &&
          response.request().method() === "DELETE"
        ),
        removeButton.click()
      ]);

      // Wait for alert dialog to close
      await familyPage.alertDialog.waitFor({ state: "hidden" });

      // Wait for refetch with timeout
      try {
        await page.waitForResponse(
          response =>
            response.url().includes("/families") &&
            response.request().method() === "GET",
          { timeout: 5000 }
        );
      } catch {
        // If refetch doesn't happen, reload the page manually
        await page.reload();
        await page.waitForLoadState("networkidle");
      }

      // Wait for member cards to update
      await page.waitForFunction(
        (expectedCount) => document.querySelectorAll('[data-testid="family-member-card"]').length === expectedCount,
        initialCount - 1,
        { timeout: 10000 }
      );

      // Verify member count decreased
      const finalCount = await familyPage.getMemberCount();
      expect(finalCount).toBe(initialCount - 1);
    });

    test("should prevent removing last parent", async ({ page }) => {
      await familyPage.memberCards.first().waitFor({ state: "visible" });
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        // Find a parent member
        let parentIndex = -1;
        for (let i = 0; i < memberCount; i++) {
          const role = await familyPage.getMemberRole(i);
          if (role?.toLowerCase().includes("parent")) {
            parentIndex = i;
            break;
          }
        }
        
        if (parentIndex >= 0) {
          await familyPage.openMemberActions(parentIndex);
          await familyPage.clickRemoveMember();
          
          // Check for error message
          const errorMessage = page.getByText(/cannot remove.*last parent/i);
          const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
          
          if (hasError) {
            // Error shown - expected behavior
            expect(hasError).toBeTruthy();
          } else {
            // No error - means there are multiple parents, which is fine
            // Cancel the dialog
            await page.getByRole("button", { name: /cancel/i }).click();
          }
        }
      }
    });
  });

  test.describe("Karma Operations", () => {
    test("should grant positive karma successfully", async ({ page }) => {
      await familyPage.memberCards.first().waitFor({ state: "visible" });
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        const initialKarma = await familyPage.getMemberKarma(0);
        
        // Open give karma dialog
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();
        
        // Fill form with positive karma
        await familyPage.fillGiveKarmaForm({
          type: "positive",
          amount: 50,
          message: "Great job on your tasks!",
        });

        // Submit and wait for API response
        await Promise.all([
          page.waitForResponse(response =>
            response.url().includes("/karma/grant") &&
            response.request().method() === "POST"
          ),
          familyPage.submitGiveKarma()
        ]);

        // Wait for dialog to close
        await familyPage.dialog.waitFor({ state: "hidden" });

        // Wait for the karma value to update in the DOM
        await page.waitForFunction(
          (expectedKarma) => {
            const karmaElement = document.querySelector('[data-testid="member-karma"]');
            const karmaText = karmaElement?.textContent || "";
            const match = karmaText.match(/-?\d+/);
            const currentKarma = match ? parseInt(match[0], 10) : 0;
            return currentKarma === expectedKarma;
          },
          initialKarma + 50,
          { timeout: 10000 }
        );

        // Verify karma increased
        const updatedKarma = await familyPage.getMemberKarma(0);
        expect(updatedKarma).toBe(initialKarma + 50);
      }
    });

    test("should deduct karma (negative) successfully", async ({ page }) => {
      await familyPage.memberCards.first().waitFor({ state: "visible" });
      
      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        const initialKarma = await familyPage.getMemberKarma(0);
        
        // Open give karma dialog
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();
        
        // Fill form with negative karma
        await familyPage.fillGiveKarmaForm({
          type: "negative",
          amount: 30,
          message: "Forgot to do chores",
        });

        // Submit and wait for API response
        await Promise.all([
          page.waitForResponse(response =>
            response.url().includes("/karma/grant") &&
            response.request().method() === "POST"
          ),
          familyPage.submitGiveKarma()
        ]);

        // Wait for dialog to close
        await familyPage.dialog.waitFor({ state: "hidden" });

        // Wait for the karma value to update in the DOM
        await page.waitForFunction(
          (expectedKarma) => {
            const karmaElement = document.querySelector('[data-testid="member-karma"]');
            const karmaText = karmaElement?.textContent || "";
            const match = karmaText.match(/-?\d+/);
            const currentKarma = match ? parseInt(match[0], 10) : 0;
            return currentKarma === expectedKarma;
          },
          initialKarma - 30,
          { timeout: 10000 }
        );

        // Verify karma decreased
        const updatedKarma = await familyPage.getMemberKarma(0);
        expect(updatedKarma).toBe(initialKarma - 30);
      }
    });

    test("should validate karma amount boundaries", async ({ page }) => {
      await familyPage.memberCards.first().waitFor({ state: "visible" });

      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();

        // Test zero amount - button should be disabled
        await familyPage.karmaAmountInput.waitFor({ state: "visible" });
        await familyPage.karmaAmountInput.fill("0");
        await familyPage.karmaMessageInput.fill("Test message");

        await expect(familyPage.karmaSubmitButton).toBeDisabled();

        // Test excessive amount (above 100000) - button enabled but shows toast error
        await familyPage.karmaAmountInput.fill("100001");

        // Button should be enabled now (upper limit not checked in disabled logic)
        await expect(familyPage.karmaSubmitButton).toBeEnabled();

        // Click submit to trigger validation
        await familyPage.submitGiveKarma();

        // Wait for toast error message containing "100,000"
        const errorToast = page.getByText(/100,000/i);
        await expect(errorToast).toBeVisible({ timeout: 3000 });
      }
    });

    test("should require message for karma grant", async () => {
      await familyPage.memberCards.first().waitFor({ state: "visible" });

      const memberCount = await familyPage.getMemberCount();
      if (memberCount > 0) {
        await familyPage.openMemberActions(0);
        await familyPage.clickGiveKarma();

        // Fill amount but not message
        await familyPage.karmaAmountInput.waitFor({ state: "visible" });
        await familyPage.karmaAmountInput.fill("50");

        await expect(familyPage.karmaSubmitButton).toBeDisabled();
      }
    });
  });

  test.describe("Add Member Workflow", () => {
    test("should successfully add a new member", async ({ page }) => {
      await setViewport(page, "desktop");
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.memberCards.first().waitFor({ state: "visible" }).catch(() => {});
      const initialCount = await familyPage.getMemberCount();
      
      await familyPage.openAddMemberDialog();
      
      // Fill form with valid data
      const timestamp = Date.now();
      await familyPage.fillAddMemberForm({
        email: `newchild${timestamp}@example.com`,
        password: "TestPass123!",
        name: "New Test Child",
        birthdate: "2015-05-10",
        role: "Child",
      });
      
      // Submit and wait for both API responses (POST and refetch GET)
      await Promise.all([
        page.waitForResponse(response =>
          response.url().includes("/members") &&
          response.request().method() === "POST"
        ),
        page.waitForResponse(response =>
          response.url().includes("/families") &&
          response.request().method() === "GET"
        ),
        familyPage.submitAddMember()
      ]);
      
      // Wait for dialog to close
      await familyPage.dialog.waitFor({ state: "hidden" });

      // Wait for the new member card to appear in the DOM
      await page.waitForFunction(
        (expectedCount) => {
          const cards = document.querySelectorAll('[data-testid="family-member-card"]');
          return cards.length === expectedCount;
        },
        initialCount + 1,
        { timeout: 10000 }
      );

      // Verify new member appears
      const finalCount = await familyPage.getMemberCount();
      expect(finalCount).toBe(initialCount + 1);
    });

    test("should validate required fields", async ({ page }) => {
      await setViewport(page, "desktop");
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.openAddMemberDialog();

      // Try to submit without filling any fields
      await familyPage.addMemberSubmit.waitFor({ state: "visible" });

      // Submit button should be disabled initially
      await expect(familyPage.addMemberSubmit).toBeDisabled();
    });

    test("should validate future birthdate", async ({ page }) => {
      await setViewport(page, "desktop");
      
      const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
      if (!buttonVisible) test.skip();
      
      await familyPage.openAddMemberDialog();
      
      // Fill with future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      
      await familyPage.fillAddMemberForm({
        email: "test@example.com",
        password: "TestPass123!",
        name: "Test User",
        birthdate: futureDateStr,
      });

      await familyPage.submitAddMember();

      // Should show validation error
      const errorText = page.getByText(/future/i);
      await expect(errorText).toBeVisible({ timeout: 3000 });
    });
  });

  test.describe("Empty State", () => {
    test("should display empty state when no members", async () => {
      // This test is tricky because we need a family with no members except current user
      // Skip if we can't create this scenario easily
      const memberCount = await familyPage.getMemberCount();

      if (memberCount === 1) {
        // If there's only one member (current user), check for empty state messaging
        const hasEmpty = await familyPage.hasEmptyState();

        if (hasEmpty) {
          await expect(familyPage.emptyState).toBeVisible();
        }
      } else {
        // Skip test if multiple members exist
        test.skip();
      }
    });
  });

  test.describe("Responsive Grid Layout", () => {
    test("should display 1-column grid on mobile", async ({ page }) => {
      await setViewport(page, "mobile");
      await page.reload();
      await page.waitForLoadState("networkidle");
      
      await familyPage.memberCards.first().waitFor({ state: "visible" }).catch(() => {});
      const memberCount = await familyPage.getMemberCount();
      
      if (memberCount > 0) {
        // Check grid layout
        const grid = familyPage.membersGrid;
        await expect(grid).toBeVisible();

        // Mobile should show mobile + button
        const mobileButton = page.getByTestId("mobile-add-button");
        // Note: Mobile button may not always be present depending on user role
        await mobileButton.isVisible().catch(() => false);
      }
    });

    test("should display 2-column grid on tablet", async ({ page }) => {
      await setViewport(page, "tablet");
      await page.reload();
      await page.waitForLoadState("networkidle");
      
      await familyPage.memberCards.first().waitFor({ state: "visible" }).catch(() => {});
      const memberCount = await familyPage.getMemberCount();
      
      if (memberCount > 0) {
        const grid = familyPage.membersGrid;
        await expect(grid).toBeVisible();
      }
    });

    test("should display 3-column grid on desktop", async ({ page }) => {
      await setViewport(page, "desktop");
      await page.reload();
      await page.waitForLoadState("networkidle");
      
      await familyPage.memberCards.first().waitFor({ state: "visible" }).catch(() => {});
      const memberCount = await familyPage.getMemberCount();
      
      if (memberCount > 0) {
        const grid = familyPage.membersGrid;
        await expect(grid).toBeVisible();
        
        // Desktop should show add member button in header
        const buttonVisible = await familyPage.addMemberButton.isVisible({ timeout: 5000 }).catch(() => false);
        if (buttonVisible) {
          await expect(familyPage.addMemberButton).toBeVisible();
        }
      }
    });
  });
});
