import Foundation
import SwiftData

enum MessageRole: String, Codable {
    case user = "USER"
    case assistant = "ASSISTANT"
    case tool = "TOOL"
    case system = "SYSTEM"
}

@Model
final class Message {
    var id: UUID
    var role: MessageRole
    var content: String
    var createdAt: Date
    var inputTokens: Int?
    var outputTokens: Int?

    /// JSON-encoded array of tool calls (for assistant messages)
    var toolCallsJSON: Data?

    var conversation: Conversation?

    init(
        role: MessageRole,
        content: String,
        conversation: Conversation? = nil,
        inputTokens: Int? = nil,
        outputTokens: Int? = nil,
        toolCalls: [ToolCallData]? = nil
    ) {
        self.id = UUID()
        self.role = role
        self.content = content
        self.createdAt = Date()
        self.inputTokens = inputTokens
        self.outputTokens = outputTokens
        self.conversation = conversation
        if let toolCalls {
            self.toolCallsJSON = try? JSONEncoder().encode(toolCalls)
        }
    }

    var toolCalls: [ToolCallData] {
        get {
            guard let data = toolCallsJSON else { return [] }
            return (try? JSONDecoder().decode([ToolCallData].self, from: data)) ?? []
        }
        set {
            toolCallsJSON = try? JSONEncoder().encode(newValue)
        }
    }
}

/// Serializable tool call data stored in messages
struct ToolCallData: Codable, Identifiable {
    var id: String { toolCallId }
    let toolCallId: String
    let toolName: String
    let args: JSONValue?
    let output: JSONValue?

    init(toolCallId: String, toolName: String, args: JSONValue? = nil, output: JSONValue? = nil) {
        self.toolCallId = toolCallId
        self.toolName = toolName
        self.args = args
        self.output = output
    }
}

/// A type-erased JSON value for encoding/decoding arbitrary JSON
enum JSONValue: Codable, Equatable, Sendable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case object([String: JSONValue])
    case array([JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if container.decodeNil() {
            self = .null
        } else if let b = try? container.decode(Bool.self) {
            self = .bool(b)
        } else if let n = try? container.decode(Double.self) {
            self = .number(n)
        } else if let s = try? container.decode(String.self) {
            self = .string(s)
        } else if let arr = try? container.decode([JSONValue].self) {
            self = .array(arr)
        } else if let obj = try? container.decode([String: JSONValue].self) {
            self = .object(obj)
        } else {
            self = .null
        }
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .string(let s): try container.encode(s)
        case .number(let n): try container.encode(n)
        case .bool(let b): try container.encode(b)
        case .object(let o): try container.encode(o)
        case .array(let a): try container.encode(a)
        case .null: try container.encodeNil()
        }
    }

    /// Convert any Codable/Sendable value to JSONValue
    static func from(_ value: Any) -> JSONValue {
        if let s = value as? String { return .string(s) }
        if let n = value as? NSNumber {
            if CFBooleanGetTypeID() == CFGetTypeID(n) {
                return .bool(n.boolValue)
            }
            return .number(n.doubleValue)
        }
        if let b = value as? Bool { return .bool(b) }
        if let i = value as? Int { return .number(Double(i)) }
        if let d = value as? Double { return .number(d) }
        if let arr = value as? [Any] { return .array(arr.map { from($0) }) }
        if let obj = value as? [String: Any] {
            return .object(obj.mapValues { from($0) })
        }
        return .null
    }

    /// Pretty-print JSON
    var prettyString: String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        guard let data = try? encoder.encode(self),
              let str = String(data: data, encoding: .utf8) else {
            return "null"
        }
        return str
    }
}
