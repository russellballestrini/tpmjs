import SwiftUI

struct ConversationRow: View {
    let conversation: Conversation

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(conversation.displayTitle)
                    .font(.system(.body, design: .default))
                    .lineLimit(1)
                    .foregroundStyle(.primary)

                Text(timeAgo(conversation.updatedAt))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }

            Spacer()

            let count = conversation.messages.count
            if count > 0 {
                Text("\(count)")
                    .font(.caption2.weight(.medium))
                    .foregroundStyle(.secondary)
                    .padding(.horizontal, 6)
                    .padding(.vertical, 2)
                    .background(.quaternary)
                    .clipShape(Capsule())
            }
        }
        .padding(.vertical, 2)
    }

    private func timeAgo(_ date: Date) -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: date, relativeTo: Date())
    }
}
