import type { Locator, Page } from "@playwright/test";

/**
 * Page Object for Chat Page
 */
export class ChatPage {
    readonly page: Page;

    // Chat interface container
    readonly chatInterface: Locator;

    // Chat list elements
    readonly chatList: Locator;
    readonly chatListTitle: Locator;
    readonly chatListItems: Locator;
    readonly chatListEmpty: Locator;
    readonly chatListLoading: Locator;
    readonly newChatButton: Locator;

    // Chat list item elements
    readonly chatItemName: Locator;
    readonly chatItemPreview: Locator;
    readonly chatItemTime: Locator;
    readonly chatItemUnreadBadge: Locator;

    // Conversation view elements
    readonly conversationView: Locator;
    readonly conversationEmpty: Locator;
    readonly conversationHeader: Locator;
    readonly conversationTitle: Locator;
    readonly messageList: Locator;
    readonly messageItems: Locator;
    readonly messageInput: Locator;
    readonly messageInputTextarea: Locator;
    readonly messageInputSubmit: Locator;
    readonly messagesLoading: Locator;

    // New chat dialog elements
    readonly newChatDialog: Locator;
    readonly newChatDialogTitle: Locator;
    readonly dmTab: Locator;
    readonly groupTab: Locator;
    readonly memberList: Locator;
    readonly memberItems: Locator;
    readonly groupTitleInput: Locator;
    readonly memberCheckboxes: Locator;
    readonly createGroupButton: Locator;
    readonly dialogCancelButton: Locator;
    readonly dialogLoading: Locator;

    constructor(page: Page) {
        this.page = page;

        // Chat interface
        this.chatInterface = page.getByTestId("chat-interface");

        // Chat list
        this.chatList = page.getByTestId("chat-list");
        this.chatListTitle = page.getByTestId("chat-list-title");
        this.chatListItems = page.getByTestId("chat-list-item");
        this.chatListEmpty = page.getByTestId("chat-list-empty");
        this.chatListLoading = page.getByTestId("chat-list-loading");
        this.newChatButton = page.getByTestId("new-chat-button");

        // Chat list item
        this.chatItemName = page.getByTestId("chat-item-name");
        this.chatItemPreview = page.getByTestId("chat-item-preview");
        this.chatItemTime = page.getByTestId("chat-item-time");
        this.chatItemUnreadBadge = page.getByTestId("chat-item-unread");

        // Conversation view
        this.conversationView = page.getByTestId("conversation-view");
        this.conversationEmpty = page.getByTestId("conversation-empty");
        this.conversationHeader = page.getByTestId("conversation-header");
        this.conversationTitle = page.getByTestId("conversation-title");
        this.messageList = page.getByTestId("message-list");
        this.messageItems = page.getByTestId("message-item");
        this.messageInput = page.getByTestId("message-input");
        this.messageInputTextarea = page.getByTestId("message-input-textarea");
        this.messageInputSubmit = page.getByTestId("message-input-submit");
        this.messagesLoading = page.getByTestId("messages-loading");

        // New chat dialog
        this.newChatDialog = page.getByTestId("new-chat-dialog");
        this.newChatDialogTitle = page.getByTestId("new-chat-dialog-title");
        this.dmTab = page.getByTestId("new-chat-dm-tab");
        this.groupTab = page.getByTestId("new-chat-group-tab");
        this.memberList = page.getByTestId("new-chat-member-list");
        this.memberItems = page.getByTestId("new-chat-member-item");
        this.groupTitleInput = page.getByTestId("new-chat-group-title");
        this.memberCheckboxes = page.getByTestId("new-chat-member-checkbox");
        this.createGroupButton = page.getByTestId("new-chat-create-group");
        this.dialogCancelButton = page.getByTestId("new-chat-cancel");
        this.dialogLoading = page.getByTestId("new-chat-loading");
    }

    /**
     * Navigate to chat page
     */
    async gotoChat(locale = "en-US"): Promise<void> {
        await this.page.goto(`/${locale}/app/chat`);
        await this.page.waitForLoadState("networkidle");
    }

    /**
     * Open new chat dialog
     */
    async openNewChatDialog(): Promise<void> {
        await this.newChatButton.click();
        await this.newChatDialog.waitFor({ state: "visible" });
    }

    /**
     * Select a chat by index
     */
    async selectChat(index: number): Promise<void> {
        await this.chatListItems.nth(index).click();
    }

    /**
     * Create a DM with a member by clicking on them
     */
    async createDmWithMember(memberIndex: number): Promise<void> {
        await this.openNewChatDialog();
        await this.memberItems.nth(memberIndex).click();
    }

    /**
     * Create a group chat
     */
    async createGroupChat(
        title: string,
        memberIndices: number[]
    ): Promise<void> {
        await this.openNewChatDialog();
        await this.groupTab.click();
        await this.groupTitleInput.fill(title);

        for (const index of memberIndices) {
            await this.memberCheckboxes.nth(index).click();
        }

        await this.createGroupButton.click();
    }

    /**
     * Send a message in the current conversation
     */
    async sendMessage(text: string): Promise<void> {
        await this.messageInputTextarea.fill(text);
        await this.messageInputSubmit.click();
    }

    /**
     * Get the count of chats in the list
     */
    async getChatCount(): Promise<number> {
        return await this.chatListItems.count();
    }

    /**
     * Get the count of messages in the conversation
     */
    async getMessageCount(): Promise<number> {
        return await this.messageItems.count();
    }

    /**
     * Check if empty state is visible
     */
    async isEmptyStateVisible(): Promise<boolean> {
        return await this.chatListEmpty.isVisible().catch(() => false);
    }

    /**
     * Check if conversation empty state is visible
     */
    async isConversationEmptyVisible(): Promise<boolean> {
        return await this.conversationEmpty.isVisible().catch(() => false);
    }

    /**
     * Get chat name by index
     */
    async getChatName(index: number): Promise<string | null> {
        return await this.chatItemName.nth(index).textContent();
    }

    /**
     * Get chat preview by index
     */
    async getChatPreview(index: number): Promise<string | null> {
        return await this.chatItemPreview.nth(index).textContent();
    }

    /**
     * Check if a chat has unread messages
     */
    async hasUnreadBadge(index: number): Promise<boolean> {
        const badge = this.chatListItems.nth(index).getByTestId("chat-item-unread");
        return await badge.isVisible().catch(() => false);
    }

    /**
     * Get message text by index
     */
    async getMessageText(index: number): Promise<string | null> {
        return await this.messageItems.nth(index).getByTestId("message-body").textContent();
    }

    /**
     * Wait for chat list to load
     */
    async waitForChatListLoad(): Promise<void> {
        // Wait for either chats to appear or empty state
        await Promise.race([
            this.chatListItems.first().waitFor({ state: "visible", timeout: 10000 }),
            this.chatListEmpty.waitFor({ state: "visible", timeout: 10000 }),
        ]);
    }

    /**
     * Wait for messages to load
     */
    async waitForMessagesLoad(): Promise<void> {
        await this.messagesLoading.waitFor({ state: "hidden", timeout: 10000 }).catch(() => { });
    }
}
