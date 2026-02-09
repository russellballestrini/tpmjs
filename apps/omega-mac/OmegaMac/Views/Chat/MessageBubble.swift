import SwiftUI

struct MessageBubble: View {
    let message: Message

    var body: some View {
        switch message.role {
        case .user:
            userBubble
        case .assistant:
            assistantBubble
        case .tool:
            toolResultsBubble
        case .system:
            EmptyView()
        }
    }

    private var userBubble: some View {
        HStack(alignment: .top) {
            Spacer(minLength: 60)
            Text(message.content)
                .font(.body)
                .foregroundStyle(.white)
                .padding(12)
                .background(.accent)
                .clipShape(RoundedRectangle(cornerRadius: 12))
                .textSelection(.enabled)
        }
        .padding(.horizontal, 16)
    }

    private var assistantBubble: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 4) {
                if !message.content.isEmpty {
                    MarkdownView(content: message.content)
                }

                // Token usage
                if let input = message.inputTokens, let output = message.outputTokens {
                    Text("In: \(input) | Out: \(output)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.tertiary)
                        .padding(.top, 4)
                }
            }
            .padding(12)
            .background(.quaternary.opacity(0.5))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .textSelection(.enabled)

            Spacer(minLength: 60)
        }
        .padding(.horizontal, 16)
    }

    private var toolResultsBubble: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 8) {
                ForEach(message.toolCalls) { tc in
                    JSONToolResultView(toolCallData: tc)
                }
            }
            Spacer(minLength: 60)
        }
        .padding(.horizontal, 16)
    }
}
