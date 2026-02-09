import Foundation

// MARK: - Request Types

struct ChatCompletionRequest: Encodable {
    let model: String
    let messages: [ChatMessage]
    let tools: [ChatTool]?
    let stream: Bool
    let maxTokens: Int?
    let streamOptions: StreamOptions?

    enum CodingKeys: String, CodingKey {
        case model, messages, tools, stream
        case maxTokens = "max_tokens"
        case streamOptions = "stream_options"
    }
}

struct StreamOptions: Encodable {
    let includeUsage: Bool

    enum CodingKeys: String, CodingKey {
        case includeUsage = "include_usage"
    }
}

struct ChatMessage: Codable {
    let role: String
    let content: String?
    let toolCalls: [ChatToolCall]?
    let toolCallId: String?
    let name: String?

    enum CodingKeys: String, CodingKey {
        case role, content, name
        case toolCalls = "tool_calls"
        case toolCallId = "tool_call_id"
    }

    static func system(_ content: String) -> ChatMessage {
        ChatMessage(role: "system", content: content, toolCalls: nil, toolCallId: nil, name: nil)
    }

    static func user(_ content: String) -> ChatMessage {
        ChatMessage(role: "user", content: content, toolCalls: nil, toolCallId: nil, name: nil)
    }

    static func assistant(content: String?, toolCalls: [ChatToolCall]?) -> ChatMessage {
        ChatMessage(role: "assistant", content: content, toolCalls: toolCalls, toolCallId: nil, name: nil)
    }

    static func toolResult(toolCallId: String, name: String, content: String) -> ChatMessage {
        ChatMessage(role: "tool", content: content, toolCalls: nil, toolCallId: toolCallId, name: name)
    }
}

struct ChatTool: Encodable {
    let type: String = "function"
    let function: ChatFunction
}

struct ChatFunction: Encodable {
    let name: String
    let description: String
    let parameters: JSONSchemaObject
}

struct JSONSchemaObject: Encodable {
    let type: String
    let properties: [String: JSONSchemaProperty]
    let required: [String]?
    let additionalProperties: Bool?
}

struct JSONSchemaProperty: Encodable {
    let type: String
    let description: String?
    let minimum: Int?
    let maximum: Int?
    let additionalProperties: JSONSchemaAdditional?

    init(type: String, description: String? = nil, minimum: Int? = nil, maximum: Int? = nil, additionalProperties: JSONSchemaAdditional? = nil) {
        self.type = type
        self.description = description
        self.minimum = minimum
        self.maximum = maximum
        self.additionalProperties = additionalProperties
    }
}

indirect enum JSONSchemaAdditional: Encodable {
    case bool(Bool)
    case typed(JSONSchemaProperty)

    func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        switch self {
        case .bool(let b): try container.encode(b)
        case .typed(let p): try container.encode(p)
        }
    }
}

struct ChatToolCall: Codable, Identifiable {
    var id: String
    let type: String?
    let function: ChatToolCallFunction?

    var toolName: String { function?.name ?? "" }
    var arguments: String { function?.arguments ?? "{}" }

    var parsedArguments: [String: JSONValue] {
        guard let data = arguments.data(using: .utf8),
              let obj = try? JSONDecoder().decode([String: JSONValue].self, from: data) else {
            return [:]
        }
        return obj
    }
}

struct ChatToolCallFunction: Codable {
    let name: String?
    let arguments: String?
}

// MARK: - Response Types (non-streaming)

struct ChatCompletionResponse: Decodable {
    let id: String
    let choices: [ChatChoice]
    let usage: ChatUsage?
}

struct ChatChoice: Decodable {
    let index: Int
    let message: ChatResponseMessage
    let finishReason: String?

    enum CodingKeys: String, CodingKey {
        case index, message
        case finishReason = "finish_reason"
    }
}

struct ChatResponseMessage: Decodable {
    let role: String
    let content: String?
    let toolCalls: [ChatToolCall]?

    enum CodingKeys: String, CodingKey {
        case role, content
        case toolCalls = "tool_calls"
    }
}

struct ChatUsage: Decodable {
    let promptTokens: Int?
    let completionTokens: Int?
    let totalTokens: Int?

    enum CodingKeys: String, CodingKey {
        case promptTokens = "prompt_tokens"
        case completionTokens = "completion_tokens"
        case totalTokens = "total_tokens"
    }
}

// MARK: - Streaming Types

struct ChatCompletionChunk: Decodable {
    let id: String?
    let choices: [ChunkChoice]?
    let usage: ChatUsage?
}

struct ChunkChoice: Decodable {
    let index: Int?
    let delta: ChunkDelta?
    let finishReason: String?

    enum CodingKeys: String, CodingKey {
        case index, delta
        case finishReason = "finish_reason"
    }
}

struct ChunkDelta: Decodable {
    let role: String?
    let content: String?
    let toolCalls: [ChunkToolCall]?

    enum CodingKeys: String, CodingKey {
        case role, content
        case toolCalls = "tool_calls"
    }
}

struct ChunkToolCall: Decodable {
    let index: Int?
    let id: String?
    let type: String?
    let function: ChunkToolCallFunction?
}

struct ChunkToolCallFunction: Decodable {
    let name: String?
    let arguments: String?
}
