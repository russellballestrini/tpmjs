import SwiftUI

struct ToolCallView: View {
    let toolCall: LiveToolCall

    var body: some View {
        HStack(alignment: .top) {
            VStack(alignment: .leading, spacing: 8) {
                HStack(spacing: 8) {
                    statusIcon
                    Text(toolCall.toolName)
                        .font(.system(.callout, design: .monospaced).bold())
                        .foregroundStyle(.primary)
                    Spacer()
                    statusBadge
                }

                // Input arguments
                if !toolCall.arguments.isEmpty {
                    DisclosureGroup("Input") {
                        Text(prettyJSON(toolCall.arguments))
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(.black.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }

                // Output
                if let output = toolCall.output {
                    DisclosureGroup("Output") {
                        Text(output.prettyString)
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(.secondary)
                            .textSelection(.enabled)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(8)
                            .background(.black.opacity(0.2))
                            .clipShape(RoundedRectangle(cornerRadius: 6))
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
            }
            .padding(12)
            .background(.quaternary.opacity(0.3))
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .strokeBorder(borderColor, lineWidth: 1)
            )
            .clipShape(RoundedRectangle(cornerRadius: 10))

            Spacer(minLength: 60)
        }
        .padding(.horizontal, 16)
    }

    @ViewBuilder
    private var statusIcon: some View {
        switch toolCall.status {
        case "running":
            ProgressView()
                .controlSize(.small)
        case "success":
            Image(systemName: "checkmark.circle.fill")
                .foregroundStyle(.green)
        case "error":
            Image(systemName: "xmark.circle.fill")
                .foregroundStyle(.red)
        default:
            Image(systemName: "questionmark.circle")
                .foregroundStyle(.secondary)
        }
    }

    @ViewBuilder
    private var statusBadge: some View {
        Text(toolCall.status.capitalized)
            .font(.system(size: 10, design: .monospaced))
            .padding(.horizontal, 6)
            .padding(.vertical, 2)
            .background(badgeColor.opacity(0.15))
            .foregroundStyle(badgeColor)
            .clipShape(Capsule())
    }

    private var badgeColor: Color {
        switch toolCall.status {
        case "running": return .orange
        case "success": return .green
        case "error": return .red
        default: return .secondary
        }
    }

    private var borderColor: Color {
        switch toolCall.status {
        case "running": return .orange.opacity(0.3)
        case "success": return .green.opacity(0.2)
        case "error": return .red.opacity(0.3)
        default: return .clear
        }
    }

    private func prettyJSON(_ jsonString: String) -> String {
        guard let data = jsonString.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data),
              let pretty = try? JSONSerialization.data(withJSONObject: obj, options: [.prettyPrinted, .sortedKeys]),
              let str = String(data: pretty, encoding: .utf8) else {
            return jsonString
        }
        return str
    }
}
