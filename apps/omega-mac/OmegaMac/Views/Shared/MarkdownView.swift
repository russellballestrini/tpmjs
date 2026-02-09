import MarkdownUI
import SwiftUI

/// Renders markdown content from assistant responses using MarkdownUI.
struct MarkdownView: View {
    let content: String

    var body: some View {
        Markdown(content)
            .markdownTheme(.omega)
            .textSelection(.enabled)
    }
}

// MARK: - Custom Markdown Theme

extension MarkdownUI.Theme {
    static let omega = Theme()
        .text {
            ForegroundColor(.primary)
            FontSize(14)
        }
        .code {
            FontFamilyVariant(.monospaced)
            FontSize(12)
            ForegroundColor(.secondary)
        }
        .codeBlock { configuration in
            configuration.label
                .markdownTextStyle {
                    FontFamilyVariant(.monospaced)
                    FontSize(12)
                    ForegroundColor(.secondary)
                }
                .padding(10)
                .background(Color.black.opacity(0.2))
                .clipShape(RoundedRectangle(cornerRadius: 6))
        }
        .link {
            ForegroundColor(.accentColor)
        }
        .heading1 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.bold)
                    FontSize(20)
                }
                .markdownMargin(top: 16, bottom: 8)
        }
        .heading2 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.semibold)
                    FontSize(17)
                }
                .markdownMargin(top: 12, bottom: 6)
        }
        .heading3 { configuration in
            configuration.label
                .markdownTextStyle {
                    FontWeight(.semibold)
                    FontSize(15)
                }
                .markdownMargin(top: 10, bottom: 4)
        }
        .blockquote { configuration in
            HStack(spacing: 0) {
                Rectangle()
                    .fill(Color.accentColor.opacity(0.4))
                    .frame(width: 3)
                configuration.label
                    .markdownTextStyle {
                        ForegroundColor(.secondary)
                        FontSize(13)
                    }
                    .padding(.leading, 10)
            }
        }
}
