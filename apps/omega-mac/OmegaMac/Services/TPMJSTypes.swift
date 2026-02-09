import Foundation

// MARK: - Search API Types

struct TPMJSSearchResponse: Decodable {
    let results: TPMJSSearchResults?
}

struct TPMJSSearchResults: Decodable {
    let tools: [TPMJSToolResult]?
}

struct TPMJSToolResult: Decodable {
    let name: String
    let description: String?
    let inputSchema: JSONValue?
    let qualityScore: Double?
    let executionHealth: String?
    let package: TPMJSPackageInfo

    enum CodingKeys: String, CodingKey {
        case name, description, inputSchema, qualityScore, executionHealth
        case package = "package"
    }
}

struct TPMJSPackageInfo: Decodable {
    let npmPackageName: String
    let npmVersion: String
    let category: String?
    let env: [TPMJSEnvVarDef]?
}

struct TPMJSEnvVarDef: Decodable, Sendable {
    let name: String
    let description: String?
    let required: Bool?
}

// MARK: - Executor API Types

struct TPMJSExecuteRequest: Encodable {
    let packageName: String
    let name: String
    let version: String
    let importUrl: String
    let params: JSONValue
    let env: [String: String]
}

struct TPMJSExecuteResponse: Decodable, Sendable {
    let success: Bool
    let output: JSONValue?
    let error: String?
    let executionTimeMs: Int?
}

// MARK: - Tool Metadata (internal tracking)

struct ToolMeta: Sendable {
    let toolId: String
    let packageName: String
    let name: String
    let description: String
    let version: String
    let importUrl: String
    let inputSchema: JSONValue?
    let env: [TPMJSEnvVarDef]?

    /// Convert to an OpenAI function tool definition
    func toChatTool() -> ChatTool {
        let properties: [String: JSONSchemaProperty]
        let required: [String]?

        if case .object(let schemaObj) = inputSchema {
            // Extract properties from schema
            var props: [String: JSONSchemaProperty] = [:]
            var reqs: [String] = []

            if case .object(let propsObj) = schemaObj["properties"] {
                for (key, value) in propsObj {
                    if case .object(let propDef) = value {
                        let typeStr: String
                        if case .string(let t) = propDef["type"] {
                            typeStr = t
                        } else {
                            typeStr = "string"
                        }
                        let desc: String?
                        if case .string(let d) = propDef["description"] {
                            desc = d
                        } else {
                            desc = nil
                        }
                        props[key] = JSONSchemaProperty(type: typeStr, description: desc)
                    }
                }
            }

            if case .array(let reqArr) = schemaObj["required"] {
                for item in reqArr {
                    if case .string(let s) = item {
                        reqs.append(s)
                    }
                }
            }

            properties = props
            required = reqs.isEmpty ? nil : reqs
        } else {
            properties = [:]
            required = nil
        }

        return ChatTool(
            function: ChatFunction(
                name: sanitizeToolName(toolId),
                description: description,
                parameters: JSONSchemaObject(
                    type: "object",
                    properties: properties,
                    required: required,
                    additionalProperties: true
                )
            )
        )
    }
}
