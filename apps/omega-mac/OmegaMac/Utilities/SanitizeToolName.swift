import Foundation

/// Sanitize a tool ID to be a valid OpenAI function name.
/// Port of the web's sanitizeToolName logic.
/// OpenAI requires tool names to be <= 64 characters and match [a-zA-Z0-9_-].
func sanitizeToolName(_ name: String) -> String {
    var sanitized = name
        .replacingOccurrences(of: "@", with: "")
        .replacingOccurrences(of: "/", with: "_")
        .replacingOccurrences(of: "-", with: "_")
        .replacingOccurrences(of: "::", with: "_")

    // Remove any remaining invalid characters
    sanitized = String(sanitized.unicodeScalars.filter { scalar in
        CharacterSet.alphanumerics.contains(scalar) || scalar == "_"
    })

    // OpenAI API requires tool names <= 64 characters
    if sanitized.count <= 64 {
        return sanitized
    }

    // Truncate but try to keep the meaningful part (tool name at the end)
    let last64 = String(sanitized.suffix(64))
    if let first = last64.first, first.isLetter {
        return last64
    }
    return String(sanitized.prefix(64))
}

/// Reverse lookup: find the original toolId from a sanitized name
/// by checking against loaded tool metadata.
func findToolId(sanitizedName: String, in tools: [String: ToolMeta]) -> String? {
    for (_, meta) in tools {
        if sanitizeToolName(meta.toolId) == sanitizedName {
            return meta.toolId
        }
    }
    return nil
}
