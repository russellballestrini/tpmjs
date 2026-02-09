import SwiftData
import SwiftUI

struct SidebarView: View {
    @Binding var selectedConversation: Conversation?
    let onNewConversation: () -> Void

    @Query(sort: \Conversation.updatedAt, order: .reverse)
    private var conversations: [Conversation]

    @Environment(\.modelContext) private var modelContext

    var body: some View {
        List(selection: $selectedConversation) {
            ForEach(conversations) { conversation in
                ConversationRow(conversation: conversation)
                    .tag(conversation)
                    .contextMenu {
                        Button("Delete", role: .destructive) {
                            deleteConversation(conversation)
                        }
                    }
            }
        }
        .listStyle(.sidebar)
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button(action: onNewConversation) {
                    Image(systemName: "plus")
                }
                .help("New Conversation (Cmd+N)")
            }
        }
        .overlay {
            if conversations.isEmpty {
                ContentUnavailableView {
                    Label("No Conversations", systemImage: "bubble.left.and.bubble.right")
                } description: {
                    Text("Press Cmd+N to start a new conversation")
                }
            }
        }
    }

    private func deleteConversation(_ conversation: Conversation) {
        if selectedConversation == conversation {
            selectedConversation = nil
        }
        modelContext.delete(conversation)
        try? modelContext.save()
    }
}
