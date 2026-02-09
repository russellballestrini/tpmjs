import SwiftUI

struct ChatInputBar: View {
    @Binding var text: String
    let isStreaming: Bool
    let onSend: () -> Void

    var body: some View {
        VStack(spacing: 4) {
            Divider()

            HStack(alignment: .bottom, spacing: 8) {
                TextEditor(text: $text)
                    .font(.body)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(.quaternary.opacity(0.3))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                    .frame(minHeight: 40, maxHeight: 160)
                    .fixedSize(horizontal: false, vertical: true)
                    .onKeyPress(.return, phases: .down) { keyPress in
                        if keyPress.modifiers.contains(.shift) {
                            return .ignored // Let shift+enter add newline
                        }
                        if canSend {
                            onSend()
                            return .handled
                        }
                        return .ignored
                    }

                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(canSend ? .accent : .tertiary)
                }
                .buttonStyle(.borderless)
                .disabled(!canSend)
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)

            Text("Enter to send, Shift+Enter for new line")
                .font(.caption2)
                .foregroundStyle(.tertiary)
                .padding(.bottom, 4)
        }
        .background(.background)
    }

    private var canSend: Bool {
        !isStreaming && !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
}
