import AppKit
import SwiftData
import SwiftUI

struct ChatView: View {
    @Bindable var conversation: Conversation
    var orchestrator: ChatOrchestrator
    @Environment(\.modelContext) private var modelContext

    @State private var inputText: String = ""
    @State private var showCopied: Bool = false

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
            ToolbarItem(placement: .automatic) {
                Button(action: copyConversationAsJSON) {
                    Label(showCopied ? "Copied!" : "Copy JSON",
                          systemImage: showCopied ? "checkmark" : "doc.on.doc")
                }
                .help("Copy conversation as JSON (Cmd+Shift+C)")
                .keyboardShortcut("c", modifiers: [.command, .shift])
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

    private func copyConversationAsJSON() {
        let messages = conversation.sortedMessages.map { msg -> [String: Any] in
            var dict: [String: Any] = [
                "role": msg.role.rawValue.lowercased(),
                "content": msg.content,
                "createdAt": ISO8601DateFormatter().string(from: msg.createdAt),
            ]
            if let input = msg.inputTokens { dict["inputTokens"] = input }
            if let output = msg.outputTokens { dict["outputTokens"] = output }

            let toolCalls = msg.toolCalls
            if !toolCalls.isEmpty {
                dict["toolCalls"] = toolCalls.map { tc -> [String: Any] in
                    var tcDict: [String: Any] = [
                        "toolCallId": tc.toolCallId,
                        "toolName": tc.toolName,
                    ]
                    if let args = tc.args,
                       let data = try? JSONEncoder().encode(args),
                       let json = try? JSONSerialization.jsonObject(with: data) {
                        tcDict["args"] = json
                    }
                    if let output = tc.output,
                       let data = try? JSONEncoder().encode(output),
                       let json = try? JSONSerialization.jsonObject(with: data) {
                        tcDict["output"] = json
                    }
                    return tcDict
                }
            }
            return dict
        }

        let payload: [String: Any] = [
            "conversationId": conversation.id.uuidString,
            "title": conversation.displayTitle,
            "createdAt": ISO8601DateFormatter().string(from: conversation.createdAt),
            "messages": messages,
        ]

        if let data = try? JSONSerialization.data(withJSONObject: payload, options: [.prettyPrinted, .sortedKeys]),
           let json = String(data: data, encoding: .utf8) {
            NSPasteboard.general.clearContents()
            NSPasteboard.general.setString(json, forType: .string)
            showCopied = true
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                showCopied = false
            }
        }
    }
}
