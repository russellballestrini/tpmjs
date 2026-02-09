import SwiftUI

struct ChatInputBar: View {
    @Binding var text: String
    let isStreaming: Bool
    let onSend: () -> Void

    var body: some View {
        VStack(spacing: 4) {
            Divider()

            HStack(alignment: .bottom, spacing: 8) {
                SendableTextEditor(text: $text, onSend: {
                    if canSend { onSend() }
                })
                .font(.body)
                .frame(minHeight: 40, maxHeight: 160)
                .fixedSize(horizontal: false, vertical: true)

                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title2)
                        .foregroundStyle(canSend ? Color.accentColor : Color.secondary)
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

/// NSTextView-backed editor that intercepts Return (send) vs Shift+Return (newline)
struct SendableTextEditor: NSViewRepresentable {
    @Binding var text: String
    let onSend: () -> Void

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        let textView = SendableNSTextView()
        textView.delegate = context.coordinator
        textView.sendAction = onSend
        textView.isRichText = false
        textView.allowsUndo = true
        textView.font = .systemFont(ofSize: NSFont.systemFontSize)
        textView.textColor = .labelColor
        textView.drawsBackground = false
        textView.isVerticallyResizable = true
        textView.isHorizontallyResizable = false
        textView.textContainerInset = NSSize(width: 8, height: 8)
        textView.textContainer?.widthTracksTextView = true
        textView.autoresizingMask = [.width]

        scrollView.documentView = textView
        scrollView.hasVerticalScroller = false
        scrollView.drawsBackground = false
        scrollView.borderType = .noBorder
        scrollView.contentView.drawsBackground = false

        // Style the scroll view as a rounded input field
        scrollView.wantsLayer = true
        scrollView.layer?.cornerRadius = 10
        scrollView.layer?.backgroundColor = NSColor.quaternaryLabelColor.withAlphaComponent(0.3).cgColor

        return scrollView
    }

    func updateNSView(_ scrollView: NSScrollView, context: Context) {
        guard let textView = scrollView.documentView as? NSTextView else { return }
        if textView.string != text {
            textView.string = text
        }
    }

    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: SendableTextEditor

        init(_ parent: SendableTextEditor) {
            self.parent = parent
        }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.text = textView.string
        }
    }
}

/// Custom NSTextView that sends on Return and inserts newline on Shift+Return
class SendableNSTextView: NSTextView {
    var sendAction: (() -> Void)?

    override func keyDown(with event: NSEvent) {
        if event.keyCode == 36 { // Return key
            if event.modifierFlags.contains(.shift) {
                super.keyDown(with: event) // Insert newline
            } else {
                sendAction?()
            }
            return
        }
        super.keyDown(with: event)
    }
}
