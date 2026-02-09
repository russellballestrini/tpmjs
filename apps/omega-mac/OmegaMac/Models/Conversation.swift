import Foundation
import SwiftData

@Model
final class Conversation {
    var id: UUID
    var title: String?
    var createdAt: Date
    var updatedAt: Date
    var executionState: String // "idle" | "running"
    var inputTokensTotal: Int
    var outputTokensTotal: Int

    @Relationship(deleteRule: .cascade, inverse: \Message.conversation)
    var messages: [Message]

    @Relationship(deleteRule: .cascade, inverse: \ToolCallRecord.conversation)
    var toolRuns: [ToolCallRecord]

    init(
        title: String? = nil
    ) {
        self.id = UUID()
        self.title = title
        self.createdAt = Date()
        self.updatedAt = Date()
        self.executionState = "idle"
        self.inputTokensTotal = 0
        self.outputTokensTotal = 0
        self.messages = []
        self.toolRuns = []
    }

    var displayTitle: String {
        title ?? "New Conversation"
    }

    var sortedMessages: [Message] {
        messages.sorted { $0.createdAt < $1.createdAt }
    }
}
