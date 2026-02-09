import SwiftUI

struct MessageList: View {
    let conversation: Conversation
    let streamingContent: String
    let isStreaming: Bool
    let liveToolCalls: [LiveToolCall]

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(conversation.sortedMessages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }

                    // Live tool calls
                    ForEach(liveToolCalls) { tc in
                        ToolCallView(toolCall: tc)
                            .id("live-tc-\(tc.id)")
                    }

                    // Streaming content
                    if !streamingContent.isEmpty {
                        HStack(alignment: .top) {
                            assistantBubble(content: streamingContent, isStreaming: true)
                            Spacer(minLength: 60)
                        }
                        .padding(.horizontal, 16)
                        .id("streaming")
                    }

                    // Thinking indicator
                    if isStreaming && streamingContent.isEmpty && liveToolCalls.isEmpty {
                        HStack {
                            StreamingIndicator()
                            Spacer()
                        }
                        .padding(.horizontal, 16)
                        .id("thinking")
                    }

                    // Bottom spacer for scroll padding
                    Color.clear.frame(height: 8)
                        .id("bottom")
                }
                .padding(.vertical, 12)
            }
            .onChange(of: streamingContent) {
                withAnimation(.easeOut(duration: 0.15)) {
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
            }
            .onChange(of: conversation.messages.count) {
                withAnimation(.easeOut(duration: 0.15)) {
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
            }
            .onChange(of: liveToolCalls.count) {
                withAnimation(.easeOut(duration: 0.15)) {
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
            }
        }
    }

    private func assistantBubble(content: String, isStreaming: Bool) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            MarkdownView(content: content)

            if isStreaming {
                Rectangle()
                    .fill(.accent)
                    .frame(width: 2, height: 16)
                    .opacity(0.8)
                    .modifier(PulseAnimation())
            }
        }
        .padding(12)
        .background(.quaternary.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

private struct PulseAnimation: ViewModifier {
    @State private var isAnimating = false

    func body(content: Content) -> some View {
        content
            .opacity(isAnimating ? 0.3 : 1.0)
            .animation(.easeInOut(duration: 0.6).repeatForever(autoreverses: true), value: isAnimating)
            .onAppear { isAnimating = true }
    }
}
