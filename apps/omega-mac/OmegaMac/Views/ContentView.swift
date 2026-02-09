import SwiftData
import SwiftUI

struct ContentView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedConversation: Conversation?
    @State private var orchestrator = ChatOrchestrator()

    var body: some View {
        NavigationSplitView {
            SidebarView(
                selectedConversation: $selectedConversation,
                onNewConversation: createNewConversation
            )
            .navigationSplitViewColumnWidth(min: 220, ideal: 260, max: 340)
        } detail: {
            if let conversation = selectedConversation {
                ChatView(conversation: conversation, orchestrator: orchestrator)
            } else {
                EmptyStateView(onNewConversation: createNewConversation)
            }
        }
        .navigationSplitViewStyle(.balanced)
        .onChange(of: selectedConversation) {
            orchestrator.resetConversation()
        }
        .onReceive(NotificationCenter.default.publisher(for: .newConversation)) { _ in
            createNewConversation()
        }
    }

    private func createNewConversation() {
        let conversation = Conversation()
        modelContext.insert(conversation)
        try? modelContext.save()
        selectedConversation = conversation
        orchestrator.resetConversation()
    }
}
