import Foundation

/// Actor that handles communication with the TPMJS tool registry API
/// and the remote executor service.
actor TPMJSRegistryService {
    private let session: URLSession
    private let registryBaseURL: String
    private let executorBaseURL: String

    init(
        registryBaseURL: String = "https://tpmjs.com",
        executorBaseURL: String = "https://executor.tpmjs.com"
    ) {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 60
        self.session = URLSession(configuration: config)
        self.registryBaseURL = registryBaseURL
        self.executorBaseURL = executorBaseURL
    }

    // MARK: - Search

    /// Search for tools matching a query using BM25
    func searchTools(query: String, limit: Int = 10) async throws -> [ToolMeta] {
        var components = URLComponents(string: "\(registryBaseURL)/api/tools/search")!
        components.queryItems = [
            URLQueryItem(name: "q", value: query),
            URLQueryItem(name: "limit", value: String(limit)),
        ]

        guard let url = components.url else {
            throw TPMJSError.invalidURL
        }

        let (data, response) = try await session.data(from: url)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            return []
        }

        let searchResponse = try JSONDecoder().decode(TPMJSSearchResponse.self, from: data)
        let tools = searchResponse.results?.tools ?? []

        return tools.map { tool in
            ToolMeta(
                toolId: "\(tool.package.npmPackageName)::\(tool.name)",
                packageName: tool.package.npmPackageName,
                name: tool.name,
                description: tool.description ?? "Tool: \(tool.name)",
                version: tool.package.npmVersion,
                importUrl: "https://esm.sh/\(tool.package.npmPackageName)@\(tool.package.npmVersion)",
                inputSchema: tool.inputSchema,
                env: tool.package.env
            )
        }
    }

    // MARK: - Execute via Executor

    /// Execute a tool via the TPMJS remote sandbox executor
    func executeTool(
        packageName: String,
        name: String,
        version: String,
        importUrl: String,
        params: JSONValue,
        env: [String: String]
    ) async throws -> TPMJSExecuteResponse {
        guard let url = URL(string: "\(executorBaseURL)/execute-tool") else {
            throw TPMJSError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = TPMJSExecuteRequest(
            packageName: packageName,
            name: name,
            version: version,
            importUrl: importUrl,
            params: params,
            env: env
        )

        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? -1
            throw TPMJSError.httpError(statusCode)
        }

        return try JSONDecoder().decode(TPMJSExecuteResponse.self, from: data)
    }

    // MARK: - Registry Execute (uses search first to find metadata)

    /// Execute a tool by its toolId (package::name format).
    /// Fetches metadata first via search, then executes via executor.
    func executeByToolId(
        toolId: String,
        params: JSONValue,
        env: [String: String]
    ) async throws -> TPMJSExecuteResponse {
        // Parse toolId format: "package::name"
        guard let separatorIndex = toolId.range(of: "::", options: .backwards) else {
            throw TPMJSError.invalidToolId(toolId)
        }

        let packageName = String(toolId[toolId.startIndex..<separatorIndex.lowerBound])
        let name = String(toolId[separatorIndex.upperBound...])

        guard !packageName.isEmpty, !name.isEmpty else {
            throw TPMJSError.invalidToolId(toolId)
        }

        // Search for the tool to get version metadata
        let searchResults = try await searchTools(query: name, limit: 10)
        guard let toolMeta = searchResults.first(where: {
            $0.packageName == packageName && $0.name == name
        }) else {
            throw TPMJSError.toolNotFound(toolId)
        }

        return try await executeTool(
            packageName: toolMeta.packageName,
            name: toolMeta.name,
            version: toolMeta.version,
            importUrl: toolMeta.importUrl,
            params: params,
            env: env
        )
    }
}

// MARK: - Errors

enum TPMJSError: LocalizedError {
    case invalidURL
    case httpError(Int)
    case invalidToolId(String)
    case toolNotFound(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid URL"
        case .httpError(let code): return "HTTP error: \(code)"
        case .invalidToolId(let id): return "Invalid tool ID format: \(id). Expected 'package::name'"
        case .toolNotFound(let id): return "Tool not found: \(id). Try using registrySearch to find available tools."
        }
    }
}
