import Foundation

/// Parses Server-Sent Events (SSE) from OpenAI's streaming API.
/// Handles `data: {...}` lines and `data: [DONE]` termination.
struct StreamParser {

    /// Accumulated tool call state during streaming
    struct ToolCallAccumulator {
        var id: String = ""
        var name: String = ""
        var arguments: String = ""
    }

    /// Result of parsing the stream - yields content deltas and complete tool calls
    enum StreamEvent: Sendable {
        case contentDelta(String)
        case toolCallStarted(index: Int, id: String, name: String)
        case toolCallArgumentDelta(index: Int, delta: String)
        case toolCallComplete(ChatToolCall)
        case usage(inputTokens: Int, outputTokens: Int)
        case done
        case error(String)
    }

    /// Parse a single SSE line and return events
    static func parseLine(_ line: String) -> [StreamEvent] {
        let trimmed = line.trimmingCharacters(in: .whitespacesAndNewlines)

        // Skip empty lines and comments
        guard !trimmed.isEmpty, !trimmed.hasPrefix(":") else {
            return []
        }

        // Must start with "data: "
        guard trimmed.hasPrefix("data: ") else {
            return []
        }

        let payload = String(trimmed.dropFirst(6))

        // Check for stream end
        if payload == "[DONE]" {
            return [.done]
        }

        // Parse JSON chunk
        guard let data = payload.data(using: .utf8) else {
            return [.error("Invalid UTF-8 in SSE payload")]
        }

        do {
            let chunk = try JSONDecoder().decode(ChatCompletionChunk.self, from: data)
            return processChunk(chunk)
        } catch {
            return [.error("Failed to parse chunk: \(error.localizedDescription)")]
        }
    }

    private static func processChunk(_ chunk: ChatCompletionChunk) -> [StreamEvent] {
        var events: [StreamEvent] = []

        if let choices = chunk.choices {
            for choice in choices {
                guard let delta = choice.delta else { continue }

                // Content delta
                if let content = delta.content, !content.isEmpty {
                    events.append(.contentDelta(content))
                }

                // Tool calls
                if let toolCalls = delta.toolCalls {
                    for tc in toolCalls {
                        let idx = tc.index ?? 0
                        if let id = tc.id, !id.isEmpty {
                            events.append(.toolCallStarted(
                                index: idx,
                                id: id,
                                name: tc.function?.name ?? ""
                            ))
                        }
                        if let args = tc.function?.arguments, !args.isEmpty {
                            events.append(.toolCallArgumentDelta(index: idx, delta: args))
                        }
                    }
                }

                // Finish reason
                if choice.finishReason == "stop" || choice.finishReason == "tool_calls" {
                    // Will be handled by [DONE]
                }
            }
        }

        // Usage info (sometimes included in last chunk)
        if let usage = chunk.usage {
            events.append(.usage(
                inputTokens: usage.promptTokens ?? 0,
                outputTokens: usage.completionTokens ?? 0
            ))
        }

        return events
    }
}
