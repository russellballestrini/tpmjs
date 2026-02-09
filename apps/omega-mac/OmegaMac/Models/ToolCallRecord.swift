import Foundation
import SwiftData

@Model
final class ToolCallRecord {
    var id: UUID
    var toolName: String
    var toolCallId: String
    var status: String // "running" | "success" | "error"
    var inputJSON: Data?
    var outputJSON: Data?
    var errorMessage: String?
    var executionTimeMs: Int?
    var createdAt: Date
    var completedAt: Date?

    var conversation: Conversation?

    init(
        toolName: String,
        toolCallId: String,
        conversation: Conversation? = nil
    ) {
        self.id = UUID()
        self.toolName = toolName
        self.toolCallId = toolCallId
        self.status = "running"
        self.createdAt = Date()
        self.conversation = conversation
    }

    var input: JSONValue? {
        get {
            guard let data = inputJSON else { return nil }
            return try? JSONDecoder().decode(JSONValue.self, from: data)
        }
        set {
            inputJSON = try? JSONEncoder().encode(newValue)
        }
    }

    var output: JSONValue? {
        get {
            guard let data = outputJSON else { return nil }
            return try? JSONDecoder().decode(JSONValue.self, from: data)
        }
        set {
            outputJSON = try? JSONEncoder().encode(newValue)
        }
    }
}
