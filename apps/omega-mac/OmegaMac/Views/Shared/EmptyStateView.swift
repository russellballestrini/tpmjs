import SwiftUI

struct EmptyStateView: View {
    let onNewConversation: () -> Void

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "star.circle.fill")
                .font(.system(size: 56))
                .foregroundStyle(.accent)
                .symbolEffect(.pulse, options: .repeating)

            Text("Omega")
                .font(.largeTitle.bold())

            Text("AI assistant powered by 1M+ tools from the TPMJS registry")
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .frame(maxWidth: 400)

            Button(action: onNewConversation) {
                Label("New Conversation", systemImage: "plus")
                    .font(.headline)
            }
            .buttonStyle(.borderedProminent)
            .controlSize(.large)
            .keyboardShortcut("n", modifiers: .command)

            VStack(alignment: .leading, spacing: 8) {
                featureRow(icon: "magnifyingglass", text: "Search 1M+ tools by keyword")
                featureRow(icon: "play.circle", text: "Execute tools in a secure sandbox")
                featureRow(icon: "bolt", text: "Auto-discovers relevant tools")
                featureRow(icon: "key", text: "Securely store API keys in Keychain")
            }
            .padding(.top, 8)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(.background)
    }

    private func featureRow(icon: String, text: String) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .frame(width: 20)
                .foregroundStyle(.accent)
            Text(text)
                .font(.callout)
                .foregroundStyle(.secondary)
        }
    }
}
