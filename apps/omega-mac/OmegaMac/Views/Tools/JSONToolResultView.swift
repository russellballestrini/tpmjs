import SwiftUI

/// Displays a persisted tool call result from a ToolCallData record.
/// Collapsible card with monospaced JSON input/output.
struct JSONToolResultView: View {
    let toolCallData: ToolCallData
    @State private var isExpanded: Bool = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            Button {
                withAnimation(.easeInOut(duration: 0.2)) {
                    isExpanded.toggle()
                }
            } label: {
                HStack(spacing: 8) {
                    Image(systemName: isError ? "xmark.circle.fill" : "checkmark.circle.fill")
                        .foregroundStyle(isError ? .red : .green)
                        .font(.caption)

                    Text(toolCallData.toolName)
                        .font(.system(.caption, design: .monospaced).bold())
                        .foregroundStyle(.primary)

                    Spacer()

                    Image(systemName: "chevron.right")
                        .font(.caption2)
                        .foregroundStyle(.tertiary)
                        .rotationEffect(.degrees(isExpanded ? 90 : 0))
                }
                .padding(.horizontal, 10)
                .padding(.vertical, 8)
            }
            .buttonStyle(.plain)

            if isExpanded {
                Divider()
                    .padding(.horizontal, 10)

                VStack(alignment: .leading, spacing: 8) {
                    // Input
                    if let args = toolCallData.args {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("INPUT")
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundStyle(.tertiary)

                            Text(args.prettyString)
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(.secondary)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(6)
                                .background(.black.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 4))
                        }
                    }

                    // Output
                    if let output = toolCallData.output {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("OUTPUT")
                                .font(.system(size: 9, design: .monospaced))
                                .foregroundStyle(.tertiary)

                            Text(output.prettyString)
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(.secondary)
                                .textSelection(.enabled)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding(6)
                                .background(.black.opacity(0.15))
                                .clipShape(RoundedRectangle(cornerRadius: 4))
                                .lineLimit(20)
                        }
                    }
                }
                .padding(10)
            }
        }
        .background(.quaternary.opacity(0.3))
        .overlay(
            RoundedRectangle(cornerRadius: 8)
                .strokeBorder(isError ? .red.opacity(0.2) : .green.opacity(0.15), lineWidth: 1)
        )
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }

    private var isError: Bool {
        if case .object(let obj) = toolCallData.output,
           case .bool(true) = obj["error"] {
            return true
        }
        return false
    }
}
