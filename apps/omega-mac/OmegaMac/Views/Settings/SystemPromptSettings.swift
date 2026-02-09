import SwiftData
import SwiftUI

struct SystemPromptSettings: View {
    @Query private var settingsArray: [UserSettings]
    @Environment(\.modelContext) private var modelContext

    @State private var promptText: String = ""
    @State private var saved: Bool = false

    private var settings: UserSettings {
        if let existing = settingsArray.first {
            return existing
        }
        let s = UserSettings()
        modelContext.insert(s)
        try? modelContext.save()
        return s
    }

    var body: some View {
        Form {
            Section("Custom System Prompt") {
                TextEditor(text: $promptText)
                    .font(.system(.body, design: .monospaced))
                    .frame(minHeight: 200)
                    .scrollContentBackground(.hidden)
                    .padding(4)
                    .background(.quaternary.opacity(0.3))
                    .clipShape(RoundedRectangle(cornerRadius: 6))

                HStack {
                    Button("Save") {
                        settings.systemPrompt = promptText.isEmpty ? nil : promptText
                        try? modelContext.save()
                        saved = true
                        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                            saved = false
                        }
                    }

                    Button("Reset to Default") {
                        promptText = ""
                        settings.systemPrompt = nil
                        try? modelContext.save()
                    }

                    Spacer()

                    if saved {
                        Text("Saved")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }
                }
            }

            Section {
                Label(
                    "Custom instructions are appended to the default Omega system prompt. Leave empty to use the default.",
                    systemImage: "info.circle"
                )
                .font(.caption)
                .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .padding()
        .onAppear {
            promptText = settings.systemPrompt ?? ""
        }
    }
}
