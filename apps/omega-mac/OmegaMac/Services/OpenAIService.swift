import Foundation

/// Actor that handles all communication with the OpenAI Chat Completions API.
/// Supports streaming via Server-Sent Events (SSE).
actor OpenAIService {
    private let session: URLSession

    init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 300
        config.timeoutIntervalForResource = 300
        self.session = URLSession(configuration: config)
    }

    /// Stream a chat completion, yielding parsed events as they arrive.
    func streamCompletion(
        apiKey: String,
        model: String,
        messages: [ChatMessage],
        tools: [ChatTool]?
    ) -> AsyncThrowingStream<StreamParser.StreamEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    let request = try buildRequest(
                        apiKey: apiKey,
                        model: model,
                        messages: messages,
                        tools: tools,
                        stream: true
                    )

                    let (bytes, response) = try await session.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse else {
                        continuation.yield(.error("Invalid response type"))
                        continuation.finish()
                        return
                    }

                    guard httpResponse.statusCode == 200 else {
                        // Try to read error body
                        var errorBody = ""
                        for try await line in bytes.lines {
                            errorBody += line
                        }
                        continuation.yield(.error("API error \(httpResponse.statusCode): \(errorBody)"))
                        continuation.finish()
                        return
                    }

                    // Track accumulated tool calls
                    var toolCallAccumulators: [Int: StreamParser.ToolCallAccumulator] = [:]

                    for try await line in bytes.lines {
                        let events = StreamParser.parseLine(line)
                        for event in events {
                            switch event {
                            case .toolCallStarted(let index, let id, let name):
                                toolCallAccumulators[index] = StreamParser.ToolCallAccumulator(
                                    id: id,
                                    name: name,
                                    arguments: ""
                                )
                                continuation.yield(event)

                            case .toolCallArgumentDelta(let index, let delta):
                                toolCallAccumulators[index]?.arguments += delta
                                continuation.yield(event)

                            case .done:
                                // Emit completed tool calls
                                for (_, acc) in toolCallAccumulators.sorted(by: { $0.key < $1.key }) {
                                    let toolCall = ChatToolCall(
                                        id: acc.id,
                                        type: "function",
                                        function: ChatToolCallFunction(
                                            name: acc.name,
                                            arguments: acc.arguments
                                        )
                                    )
                                    continuation.yield(.toolCallComplete(toolCall))
                                }
                                continuation.yield(.done)
                                continuation.finish()

                            default:
                                continuation.yield(event)
                            }
                        }
                    }

                    // If we reach here without [DONE], still emit completed tool calls
                    if !toolCallAccumulators.isEmpty {
                        for (_, acc) in toolCallAccumulators.sorted(by: { $0.key < $1.key }) {
                            let toolCall = ChatToolCall(
                                id: acc.id,
                                type: "function",
                                function: ChatToolCallFunction(
                                    name: acc.name,
                                    arguments: acc.arguments
                                )
                            )
                            continuation.yield(.toolCallComplete(toolCall))
                        }
                    }
                    continuation.finish()

                } catch {
                    continuation.yield(.error(error.localizedDescription))
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    private func buildRequest(
        apiKey: String,
        model: String,
        messages: [ChatMessage],
        tools: [ChatTool]?,
        stream: Bool
    ) throws -> URLRequest {
        var request = URLRequest(url: URL(string: "https://api.openai.com/v1/chat/completions")!)
        request.httpMethod = "POST"
        request.addValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ChatCompletionRequest(
            model: model,
            messages: messages,
            tools: tools?.isEmpty == true ? nil : tools,
            stream: stream,
            maxTokens: 4096,
            streamOptions: stream ? StreamOptions(includeUsage: true) : nil
        )

        request.httpBody = try JSONEncoder().encode(body)
        return request
    }
}
