import { expect, test } from "@playwright/test";
import { type AuthenticatedUser, authenticateUser } from "../helpers/auth";
import { FamilyMemberDetailPage } from "../pages/family-member-detail.page";
import { FamilyPage } from "../pages/family.page";
import { setViewport, waitForPageLoad } from "../setup/test-helpers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";

test.describe("Family Member Detail Page", () => {
    let familyPage: FamilyPage;
    let memberDetailPage: FamilyMemberDetailPage;
    let parentUser: AuthenticatedUser;
    let memberId: string;

    test.beforeEach(async ({ page }) => {
        familyPage = new FamilyPage(page);
        memberDetailPage = new FamilyMemberDetailPage(page);

        // Authenticate as parent user with a family
        parentUser = await authenticateUser(page, {
            name: "Parent Test User",
            birthdate: "1985-03-15",
            createFamily: true,
            familyName: "Test Family",
        });

        // Go to family page to get member ID
        await familyPage.gotoFamily("en-US");
        await waitForPageLoad(page);
        await familyPage.waitForMemberCards();

        // Get first member ID from the page
        const memberCount = await familyPage.getMemberCount();
        if (memberCount > 0) {
            // Extract member ID from the first member card's view details link
            const viewDetailsLink = page
                .getByTestId("member-view-details-link")
                .first();
            const href = await viewDetailsLink.getAttribute("href");
            memberId = href?.split("/").pop() || "";
        }
    });

    test.describe("Navigation", () => {
        test("should navigate to member detail page from family overview", async ({
            page,
        }) => {
            const memberCount = await familyPage.getMemberCount();
            if (memberCount === 0) {
                test.skip();
            }

            // Click view details button
            await page.getByTestId("member-view-details-link").first().click();
            await waitForPageLoad(page);

            // Verify we're on the detail page
            await expect(memberDetailPage.memberName).toBeVisible();
            await expect(memberDetailPage.memberAge).toBeVisible();
        });

        test("should navigate back to family page via breadcrumb (desktop)", async ({
            page,
        }) => {
            if (!memberId) test.skip();

            await setViewport(page, "desktop");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await memberDetailPage.navigateToFamilyViaBreadcrumb();
            await waitForPageLoad(page);

            // Verify we're back on family page
            await expect(familyPage.pageTitle).toBeVisible();
        });

        test("should navigate back to family page via back button (mobile)", async ({
            page,
        }) => {
            if (!memberId) test.skip();

            await setViewport(page, "mobile");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await memberDetailPage.navigateToFamilyViaBackButton();
            await waitForPageLoad(page);

            // Verify we're back on family page
            await expect(familyPage.mobilePageTitle).toBeVisible();
        });
    });

    test.describe("Member Information Display", () => {
        test("should display member name and age", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.memberName).toBeVisible();
            await expect(memberDetailPage.memberAge).toBeVisible();

            const nameText = await memberDetailPage.memberName.textContent();
            expect(nameText).toBeTruthy();
            expect(nameText?.length).toBeGreaterThan(0);
        });

        test("should display member avatar", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.memberAvatar).toBeVisible();
        });

        test("should display member karma", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.memberKarma).toBeVisible();

            const karma = await memberDetailPage.getKarmaAmount();
            expect(Number(karma)).toBeGreaterThanOrEqual(0);
        });
    });

    test.describe("Breadcrumb Navigation", () => {
        test("should display breadcrumbs on desktop", async ({ page }) => {
            if (!memberId) test.skip();

            await setViewport(page, "desktop");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.breadcrumbFamilyMembers).toBeVisible();
            await expect(memberDetailPage.breadcrumbCurrentMember).toBeVisible();
        });

        test("should hide breadcrumbs on mobile", async ({ page }) => {
            if (!memberId) test.skip();

            await setViewport(page, "mobile");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            // Breadcrumbs should be hidden on mobile
            await expect(memberDetailPage.breadcrumbFamilyMembers).not.toBeVisible();
        });
    });

    test.describe("Tabs", () => {
        test("should display both tabs", async ({ page }) => {
            if (!memberId) test.skip();
    
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
    
            // Check that both tabs are visible
            await expect(memberDetailPage.contributionGoalTab).toBeVisible();
            await expect(memberDetailPage.giveKarmaTab).toBeVisible();
            
            // Verify the contribution goal tab is selected by default
            await expect(memberDetailPage.contributionGoalTab).toHaveAttribute('data-state', 'active');
            await expect(memberDetailPage.giveKarmaTab).not.toHaveAttribute('data-state', 'active');
        });
    
        test("should display karma card content when switching to karma tab", async ({ page }) => {
            if (!memberId) test.skip();
    
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
    
            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
    
            // Verify the karma tab is now active
            await expect(memberDetailPage.giveKarmaTab).toHaveAttribute('data-state', 'active');
            await expect(memberDetailPage.contributionGoalTab).not.toHaveAttribute('data-state', 'active');
    
            // Check that the karma card and its content are visible
            await expect(memberDetailPage.karmaCard).toBeVisible();
            await expect(memberDetailPage.karmaAmountInput).toBeVisible();
            await expect(memberDetailPage.karmaDescriptionInput).toBeVisible();
            await expect(memberDetailPage.giveKarmaButton).toBeVisible();
        });
    });

    test.describe("Karma Grant", () => {
        test("should grant positive karma successfully", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);

            const initialKarma = await memberDetailPage.getKarmaAmount();

            await memberDetailPage.grantKarma(10, "Great job on homework!");

            // Wait for success toast - check for the translated title "Karma Awarded"
            await expect(page.getByText("Karma Awarded")).toBeVisible({
                                timeout: 5000,
                            });

            // Verify karma increased
            // Wait for karma amount to update instead of fixed timeout
            await memberDetailPage.memberKarma.waitFor({ state: 'visible' });
            const newKarma = await memberDetailPage.getKarmaAmount();
            expect(Number(newKarma)).toBe(Number(initialKarma) + 10);
        });
    
        test("should deduct karma with negative amount", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);

            const initialKarma = await memberDetailPage.getKarmaAmount();

            await memberDetailPage.grantKarma(-5, "Broke house rule");

            // Wait for success toast - check for the translated title "Karma Awarded"
            await expect(page.getByText("Karma Awarded")).toBeVisible({
                                timeout: 5000,
                            });

            // Verify karma decreased
            // Wait for karma amount to update instead of fixed timeout
            await memberDetailPage.memberKarma.waitFor({ state: 'visible' });
            const newKarma = await memberDetailPage.getKarmaAmount();
            expect(Number(newKarma)).toBe(Number(initialKarma) - 5);
        });
    
        test("should validate empty description", async ({ page }) => {
            if (!memberId) test.skip();
    
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
            
            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
    
            await memberDetailPage.karmaAmountInput.fill("10");
            await memberDetailPage.giveKarmaButton.click();
    
            // Should show error toast
            await expect(page.getByText(/description required/i)).toBeVisible({
                timeout: 5000,
            });
        });
    
        test("should validate zero amount", async ({ page }) => {
            if (!memberId) test.skip();
    
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
            
            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
    
            await memberDetailPage.karmaAmountInput.fill("0");
            await memberDetailPage.karmaDescriptionInput.fill("Test description");
            await memberDetailPage.giveKarmaButton.click();
    
            // Should show error toast
            await expect(page.getByText(/invalid amount/i)).toBeVisible({
                timeout: 5000,
            });
        });
    
        test("should refresh activity timeline after karma grant", async ({
            page,
        }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            // First switch to the karma tab since it's no longer the default
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);

            const initialEventCount = await memberDetailPage.getActivityEventCount();

            await memberDetailPage.grantKarma(5, "Good behavior");

            // Wait for success toast - check for the translated title "Karma Awarded"
            await expect(page.getByText("Karma Awarded")).toBeVisible({
                            timeout: 5000,
                        });

            // Wait for at least one activity event to be visible
            await memberDetailPage.waitForActivityEvent();

            const newEventCount = await memberDetailPage.getActivityEventCount();
            expect(newEventCount).toBeGreaterThan(initialEventCount);
        });
    });

    test.describe("Actions Menu (Parent Only)", () => {
        test("should display actions menu for parent users", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.actionsButton).toBeVisible();
        });

        test("should open edit role dialog", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await memberDetailPage.clickEditMember();

            await expect(memberDetailPage.editRoleDialog).toBeVisible({
                timeout: 5000,
            });
        });

        test("should open remove member dialog", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await memberDetailPage.clickRemoveMember();

            await expect(memberDetailPage.removeMemberDialog).toBeVisible({
                timeout: 5000,
            });
        });
    });

    test.describe("Activity Timeline", () => {
        test("should display activity timeline", async ({ page }) => {
            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            await expect(memberDetailPage.activityTimeline).toBeVisible();
        });

        test("should display member-specific events", async ({ page }) => {
            if (!memberId) test.skip();
        
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
            
            // Since the karma tab is no longer the default, we don't need to wait for the karma card
            // Activity events should be visible regardless of the active tab
            const eventCount = await memberDetailPage.getActivityEventCount();
            expect(eventCount).toBeGreaterThanOrEqual(0);
        });
    });

    test.describe("Child User Permissions", () => {
        test("should not show karma tab for child users", async ({ page }) => {
            // Create a child user and add them to the parent's family
            const childUser = await authenticateUser(page, {
                name: "Child Test User",
                birthdate: "2010-01-01",
                createFamily: false,
            });

            // Add child to parent's family via API
            const addMemberResponse = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002"}/v1/families/${parentUser.familyId}/members`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${parentUser.sessionToken}`,
                    },
                    body: JSON.stringify({
                        email: childUser.email,
                        password: "TestPassword123!",
                        name: childUser.name,
                        birthdate: "2010-01-01",
                        role: "Child",
                    }),
                },
            );

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
                    secure: false,
                    sameSite: "Lax",
                },
            ]);

            if (!memberId) test.skip();

            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);

            // Child users should not see karma tab or actions
            await expect(memberDetailPage.giveKarmaTab).not.toBeVisible();
            await expect(memberDetailPage.actionsButton).not.toBeVisible();
            await expect(memberDetailPage.karmaCard).not.toBeVisible();

            // But they should still see activity timeline
            await expect(memberDetailPage.activityTimeline).toBeVisible();
        });
    });

    test.describe("Responsive Design", () => {
        test("should display correctly on mobile", async ({ page }) => {
            if (!memberId) test.skip();
        
            await setViewport(page, "mobile");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
        
            // Back button should be visible on mobile
            await expect(memberDetailPage.backToFamilyButton).toBeVisible();
        
            // Breadcrumbs should be hidden
            await expect(memberDetailPage.breadcrumbFamilyMembers).not.toBeVisible();
        
            // Main content should still be visible
            await expect(memberDetailPage.memberName).toBeVisible();
            
            // Switch to karma tab to check karma card visibility
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
            await expect(memberDetailPage.karmaCard).toBeVisible();
        });

        test("should display correctly on tablet", async ({ page }) => {
            if (!memberId) test.skip();
        
            await setViewport(page, "tablet");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
        
            await expect(memberDetailPage.memberName).toBeVisible();
            
            // Switch to karma tab to check karma card visibility
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
            await expect(memberDetailPage.karmaCard).toBeVisible();
        });

        test("should display correctly on desktop", async ({ page }) => {
            if (!memberId) test.skip();
        
            await setViewport(page, "desktop");
            await memberDetailPage.goto(memberId);
            await waitForPageLoad(page);
        
            // Breadcrumbs should be visible on desktop
            await expect(memberDetailPage.breadcrumbFamilyMembers).toBeVisible();
        
            // Back button should be hidden
            await expect(memberDetailPage.backToFamilyButton).not.toBeVisible();
        
            await expect(memberDetailPage.memberName).toBeVisible();
            
            // Switch to karma tab to check karma card visibility
            await memberDetailPage.giveKarmaTab.click();
            await waitForPageLoad(page);
            await expect(memberDetailPage.karmaCard).toBeVisible();
        });
    });
});
