import Foundation
import SwiftData

/// Represents a live tool call being displayed during streaming
struct LiveToolCall: Identifiable, Sendable {
    let id: String // toolCallId
    let toolName: String
    var arguments: String
    var status: String // "running" | "success" | "error"
    var output: JSONValue?
}

/// Main orchestrator for the Omega agentic chat loop.
/// Coordinates between OpenAI, TPMJS registry, and SwiftData persistence.
@MainActor
@Observable
final class ChatOrchestrator {
    // MARK: - Published State

    var streamingContent: String = ""
    var isStreaming: Bool = false
    var liveToolCalls: [LiveToolCall] = []
    var error: String?

    // MARK: - Private State

    private let openAI = OpenAIService()
    private let registry = TPMJSRegistryService()

    /// Dynamically loaded tools for the current conversation (sanitizedName -> ToolMeta)
    private var loadedTools: [String: ToolMeta] = [:]

    /// Maximum agentic loop iterations (search -> execute -> respond)
    private let maxIterations = 10

    // MARK: - Public API

    /// Send a user message and run the full agentic loop.
    /// Streams the response, handles tool calls, and persists everything to SwiftData.
    func sendMessage(
        _ text: String,
        conversation: Conversation,
        modelContext: ModelContext
    ) async {
        // Reset state
        streamingContent = ""
        isStreaming = true
        liveToolCalls = []
        error = nil

        // Get API key
        guard let apiKey = KeychainService.load(key: "OPENAI_API_KEY"), !apiKey.isEmpty else {
            error = "No OpenAI API key set. Open Settings (Cmd+,) to add your key."
            isStreaming = false
            return
        }

        // Load user settings
        let settingsDescriptor = FetchDescriptor<UserSettings>()
        let settings = (try? modelContext.fetch(settingsDescriptor))?.first

        let model = settings?.selectedModel ?? "gpt-4.1-mini"
        let customPrompt = settings?.systemPrompt
        let pinnedToolIds = settings?.pinnedToolIds ?? []

        // Save user message
        let userMessage = Message(role: .user, content: text, conversation: conversation)
        modelContext.insert(userMessage)
        conversation.updatedAt = Date()
        conversation.executionState = "running"
        try? modelContext.save()

        // Load env vars from Keychain
        let envVarDescriptor = FetchDescriptor<EnvVar>()
        let envVarRecords = (try? modelContext.fetch(envVarDescriptor)) ?? []
        let envVars = KeychainService.loadAllEnvVars(keyNames: envVarRecords.map(\.keyName))

        // Auto-discover tools via BM25 search
        do {
            let relevantTools = try await registry.searchTools(query: text, limit: 10)
            for toolMeta in relevantTools {
                let sanitized = sanitizeToolName(toolMeta.toolId)
                if loadedTools[sanitized] == nil {
                    loadedTools[sanitized] = toolMeta
                }
            }
        } catch {
            // Non-fatal: continue without auto-discovered tools
            print("Auto-discovery failed: \(error)")
        }

        // Build messages array from conversation history
        var chatMessages = buildChatMessages(
            conversation: conversation,
            customPrompt: customPrompt,
            pinnedToolIds: pinnedToolIds
        )

        // Add the new user message
        chatMessages.append(.user(text))

        // Build tools list
        let tools = buildToolsList()

        // Agentic loop
        var iteration = 0
        var allToolCallData: [ToolCallData] = []
        var allToolResultData: [ToolCallData] = []
        var totalInputTokens = 0
        var totalOutputTokens = 0

        while iteration < maxIterations {
            iteration += 1

            var currentContent = ""
            var pendingToolCalls: [ChatToolCall] = []
            var receivedDone = false

            do {
                let stream = await openAI.streamCompletion(
                    apiKey: apiKey,
                    model: model,
                    messages: chatMessages,
                    tools: tools.isEmpty ? nil : tools
                )

                for try await event in stream {
                    switch event {
                    case .contentDelta(let delta):
                        currentContent += delta
                        streamingContent = currentContent

                    case .toolCallStarted(_, let id, let name):
                        let liveTC = LiveToolCall(
                            id: id,
                            toolName: name,
                            arguments: "",
                            status: "running"
                        )
                        liveToolCalls.append(liveTC)

                    case .toolCallArgumentDelta(let index, let delta):
                        if index < liveToolCalls.count {
                            liveToolCalls[index].arguments += delta
                        }

                    case .toolCallComplete(let toolCall):
                        pendingToolCalls.append(toolCall)

                    case .usage(let input, let output):
                        totalInputTokens += input
                        totalOutputTokens += output

                    case .done:
                        receivedDone = true

                    case .error(let msg):
                        self.error = msg
                    }
                }
            } catch {
                self.error = error.localizedDescription
                break
            }

            // If we got content with no tool calls, we're done
            if pendingToolCalls.isEmpty {
                streamingContent = currentContent
                break
            }

            // Process tool calls
            // Add assistant message with tool calls to chat history
            chatMessages.append(.assistant(
                content: currentContent.isEmpty ? nil : currentContent,
                toolCalls: pendingToolCalls
            ))

            // Execute each tool call
            for toolCall in pendingToolCalls {
                let tcData = ToolCallData(
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    args: .object(toolCall.parsedArguments)
                )
                allToolCallData.append(tcData)

                // Record tool run
                let record = ToolCallRecord(
                    toolName: toolCall.toolName,
                    toolCallId: toolCall.id,
                    conversation: conversation
                )
                record.input = .object(toolCall.parsedArguments)
                modelContext.insert(record)

                let result = await executeToolCall(
                    toolCall: toolCall,
                    envVars: envVars
                )

                // Update live tool call status
                if let idx = liveToolCalls.firstIndex(where: { $0.id == toolCall.id }) {
                    liveToolCalls[idx].status = result.isError ? "error" : "success"
                    liveToolCalls[idx].output = result.output
                }

                // Update record
                record.output = result.output
                record.status = result.isError ? "error" : "success"
                record.completedAt = Date()

                // Add tool result to chat messages
                let resultJSON: String
                if let data = try? JSONEncoder().encode(result.output) {
                    resultJSON = String(data: data, encoding: .utf8) ?? "{}"
                } else {
                    resultJSON = "{}"
                }

                chatMessages.append(.toolResult(
                    toolCallId: toolCall.id,
                    name: toolCall.toolName,
                    content: resultJSON
                ))

                let trData = ToolCallData(
                    toolCallId: toolCall.id,
                    toolName: toolCall.toolName,
                    args: .object(toolCall.parsedArguments),
                    output: result.output
                )
                allToolResultData.append(trData)
            }

            // Reset streaming for next iteration
            streamingContent = ""
            liveToolCalls = []
        }

        // Save assistant message
        let assistantMessage = Message(
            role: .assistant,
            content: streamingContent,
            conversation: conversation,
            inputTokens: totalInputTokens,
            outputTokens: totalOutputTokens,
            toolCalls: allToolCallData.isEmpty ? nil : allToolCallData
        )
        modelContext.insert(assistantMessage)

        // Save tool results as a TOOL message if we had tool calls
        if !allToolResultData.isEmpty {
            let toolMessage = Message(
                role: .tool,
                content: "Tool results",
                conversation: conversation,
                toolCalls: allToolResultData
            )
            modelContext.insert(toolMessage)
        }

        // Update conversation
        conversation.executionState = "idle"
        conversation.inputTokensTotal += totalInputTokens
        conversation.outputTokensTotal += totalOutputTokens
        conversation.updatedAt = Date()

        // Auto-title from first message
        if conversation.title == nil {
            let title = text.count > 50 ? String(text.prefix(50)) + "..." : text
            conversation.title = title
        }

        try? modelContext.save()

        isStreaming = false
    }

    /// Clear loaded tools (when switching conversations)
    func resetConversation() {
        loadedTools = [:]
        streamingContent = ""
        isStreaming = false
        liveToolCalls = []
        error = nil
    }

    // MARK: - Private Helpers

    private struct ToolResult {
        let output: JSONValue
        let isError: Bool
    }

    private func executeToolCall(
        toolCall: ChatToolCall,
        envVars: [String: String]
    ) async -> ToolResult {
        let name = toolCall.toolName
        let args = toolCall.parsedArguments

        // Handle registrySearch
        if name == "registrySearch" {
            return await handleRegistrySearch(args: args)
        }

        // Handle registryExecute
        if name == "registryExecute" {
            return await handleRegistryExecute(args: args, envVars: envVars)
        }

        // Handle dynamic tools (loaded from search)
        if let toolMeta = loadedTools[name] {
            return await handleDynamicTool(meta: toolMeta, args: args, envVars: envVars)
        }

        // Also check by finding the tool ID from the sanitized name
        if let toolId = findToolId(sanitizedName: name, in: loadedTools),
           let toolMeta = loadedTools.values.first(where: { $0.toolId == toolId }) {
            return await handleDynamicTool(meta: toolMeta, args: args, envVars: envVars)
        }

        return ToolResult(
            output: .object([
                "error": .bool(true),
                "message": .string("Unknown tool: \(name)"),
            ]),
            isError: true
        )
    }

    private func handleRegistrySearch(args: [String: JSONValue]) async -> ToolResult {
        guard case .string(let query) = args["query"] else {
            return ToolResult(
                output: .object(["error": .bool(true), "message": .string("Missing 'query' parameter")]),
                isError: true
            )
        }

        let limit: Int
        if case .number(let n) = args["limit"] {
            limit = Int(n)
        } else {
            limit = 5
        }

        do {
            let tools = try await registry.searchTools(query: query, limit: limit)

            // Inject found tools into loaded tools
            for toolMeta in tools {
                let sanitized = sanitizeToolName(toolMeta.toolId)
                if loadedTools[sanitized] == nil {
                    loadedTools[sanitized] = toolMeta
                }
            }

            let toolsJSON: [JSONValue] = tools.map { t in
                .object([
                    "toolId": .string(t.toolId),
                    "name": .string(t.name),
                    "package": .string(t.packageName),
                    "description": .string(t.description),
                ])
            }

            return ToolResult(
                output: .object([
                    "query": .string(query),
                    "matchCount": .number(Double(tools.count)),
                    "tools": .array(toolsJSON),
                ]),
                isError: false
            )
        } catch {
            return ToolResult(
                output: .object([
                    "error": .bool(true),
                    "message": .string(error.localizedDescription),
                ]),
                isError: true
            )
        }
    }

    private func handleRegistryExecute(
        args: [String: JSONValue],
        envVars: [String: String]
    ) async -> ToolResult {
        guard case .string(let toolId) = args["toolId"] else {
            return ToolResult(
                output: .object(["error": .bool(true), "message": .string("Missing 'toolId' parameter")]),
                isError: true
            )
        }

        let params = args["params"] ?? .object([:])

        do {
            let response = try await registry.executeByToolId(
                toolId: toolId,
                params: params,
                env: envVars
            )

            if response.success {
                return ToolResult(
                    output: .object([
                        "toolId": .string(toolId),
                        "executionTimeMs": .number(Double(response.executionTimeMs ?? 0)),
                        "output": response.output ?? .null,
                    ]),
                    isError: false
                )
            } else {
                return ToolResult(
                    output: .object([
                        "error": .bool(true),
                        "message": .string(response.error ?? "Tool execution failed"),
                        "toolId": .string(toolId),
                    ]),
                    isError: true
                )
            }
        } catch {
            return ToolResult(
                output: .object([
                    "error": .bool(true),
                    "message": .string(error.localizedDescription),
                    "toolId": .string(toolId),
                ]),
                isError: true
            )
        }
    }

    private func handleDynamicTool(
        meta: ToolMeta,
        args: [String: JSONValue],
        envVars: [String: String]
    ) async -> ToolResult {
        do {
            let response = try await registry.executeTool(
                packageName: meta.packageName,
                name: meta.name,
                version: meta.version,
                importUrl: meta.importUrl,
                params: .object(args),
                env: envVars
            )

            if response.success {
                return ToolResult(
                    output: response.output ?? .null,
                    isError: false
                )
            } else {
                return ToolResult(
                    output: .object([
                        "error": .bool(true),
                        "message": .string(response.error ?? "Tool execution failed"),
                        "toolId": .string(meta.toolId),
                    ]),
                    isError: true
                )
            }
        } catch {
            return ToolResult(
                output: .object([
                    "error": .bool(true),
                    "message": .string(error.localizedDescription),
                    "toolId": .string(meta.toolId),
                ]),
                isError: true
            )
        }
    }

    /// Build chat messages from conversation history
    private func buildChatMessages(
        conversation: Conversation,
        customPrompt: String?,
        pinnedToolIds: [String]
    ) -> [ChatMessage] {
        var messages: [ChatMessage] = []

        // System prompt
        let systemPrompt = SystemPromptBuilder.build(
            customSystemPrompt: customPrompt,
            pinnedToolIds: pinnedToolIds,
            loadedTools: loadedTools
        )
        messages.append(.system(systemPrompt))

        // Last 20 messages from conversation history
        let sorted = conversation.sortedMessages
        let recent = sorted.suffix(20)

        for msg in recent {
            switch msg.role {
            case .user:
                messages.append(.user(msg.content))

            case .assistant:
                let toolCalls = msg.toolCalls
                if !toolCalls.isEmpty {
                    let chatToolCalls = toolCalls.map { tc in
                        ChatToolCall(
                            id: tc.toolCallId,
                            type: "function",
                            function: ChatToolCallFunction(
                                name: tc.toolName,
                                arguments: {
                                    if let args = tc.args,
                                       let data = try? JSONEncoder().encode(args) {
                                        return String(data: data, encoding: .utf8) ?? "{}"
                                    }
                                    return "{}"
                                }()
                            )
                        )
                    }
                    messages.append(.assistant(content: msg.content, toolCalls: chatToolCalls))
                } else {
                    messages.append(.assistant(content: msg.content, toolCalls: nil))
                }

            case .tool:
                for tc in msg.toolCalls {
                    let outputJSON: String
                    if let output = tc.output,
                       let data = try? JSONEncoder().encode(output) {
                        outputJSON = String(data: data, encoding: .utf8) ?? "{}"
                    } else {
                        outputJSON = "{}"
                    }
                    messages.append(.toolResult(
                        toolCallId: tc.toolCallId,
                        name: tc.toolName,
                        content: outputJSON
                    ))
                }

            case .system:
                break
            }
        }

        return messages
    }

    /// Build the OpenAI tools array from static + dynamic tools
    private func buildToolsList() -> [ChatTool] {
        var tools: [ChatTool] = []

        // Static: registrySearch
        tools.append(ChatTool(
            function: ChatFunction(
                name: "registrySearch",
                description: "Search the TPMJS tool registry to find AI SDK tools. Use this to discover tools for any task. Returns toolIds that can be executed with registryExecute.",
                parameters: JSONSchemaObject(
                    type: "object",
                    properties: [
                        "query": JSONSchemaProperty(
                            type: "string",
                            description: "Search query (keywords, tool names, descriptions)"
                        ),
                        "limit": JSONSchemaProperty(
                            type: "number",
                            description: "Maximum number of results (1-20, default 5)",
                            minimum: 1,
                            maximum: 20
                        ),
                    ],
                    required: ["query"],
                    additionalProperties: false
                )
            )
        ))

        // Static: registryExecute
        tools.append(ChatTool(
            function: ChatFunction(
                name: "registryExecute",
                description: "Execute a tool from the TPMJS registry. Use registrySearch first to find the toolId. Tools run in a secure sandbox.",
                parameters: JSONSchemaObject(
                    type: "object",
                    properties: [
                        "toolId": JSONSchemaProperty(
                            type: "string",
                            description: "Tool identifier from registrySearch (format: 'package::name')"
                        ),
                        "params": JSONSchemaProperty(
                            type: "object",
                            description: "Parameters to pass to the tool",
                            additionalProperties: .bool(true)
                        ),
                    ],
                    required: ["toolId", "params"],
                    additionalProperties: false
                )
            )
        ))

        // Dynamic tools
        for (_, meta) in loadedTools {
            tools.append(meta.toChatTool())
        }

        return tools
    }
}
