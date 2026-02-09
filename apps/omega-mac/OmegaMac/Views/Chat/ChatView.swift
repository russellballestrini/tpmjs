import SwiftData
import SwiftUI

struct ChatView: View {
    @Bindable var conversation: Conversation
    var orchestrator: ChatOrchestrator
    @Environment(\.modelContext) private var modelContext

    @State private var inputText: String = ""

    var body: some View {
        VStack(spacing: 0) {
            // Messages
            MessageList(
                conversation: conversation,
                streamingContent: orchestrator.streamingContent,
                isStreaming: orchestrator.isStreaming,
                liveToolCalls: orchestrator.liveToolCalls
            )

            // Error banner
            if let error = orchestrator.error {
                HStack {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .foregroundStyle(.red)
                    Text(error)
                        .font(.callout)
                        .foregroundStyle(.red)
                    Spacer()
                    Button("Dismiss") {
                        orchestrator.error = nil
                    }
                    .buttonStyle(.borderless)
                    .font(.callout)
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(.red.opacity(0.1))
            }

            // Input bar
            ChatInputBar(
                text: $inputText,
                isStreaming: orchestrator.isStreaming,
                onSend: sendMessage
            )
        }
        .navigationTitle(conversation.displayTitle)
        .toolbar {
            ToolbarItem(placement: .automatic) {
                if orchestrator.isStreaming {
                    ProgressView()
                        .controlSize(.small)
                }
            }
        }
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        inputText = ""

        Task {
            await orchestrator.sendMessage(text, conversation: conversation, modelContext: modelContext)
        }
    }
}
