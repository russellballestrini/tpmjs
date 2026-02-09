import SwiftData
import SwiftUI

struct APIKeySettings: View {
    @State private var apiKey: String = ""
    @State private var hasKey: Bool = false
    @State private var showKey: Bool = false
    @State private var saveStatus: String?

    @Query private var settingsArray: [UserSettings]
    @Environment(\.modelContext) private var modelContext

    private var settings: UserSettings {
        if let existing = settingsArray.first {
            return existing
        }
        let s = UserSettings()
        modelContext.insert(s)
        try? modelContext.save()
        return s
    }

    @State private var selectedModel: String = "gpt-4.1-mini"

    private let availableModels = [
        "gpt-4.1-mini",
        "gpt-4.1",
        "gpt-4.1-nano",
        "gpt-4o",
        "gpt-4o-mini",
        "o4-mini",
    ]

    var body: some View {
        Form {
            Section("OpenAI API Key") {
                HStack {
                    if showKey {
                        TextField("sk-...", text: $apiKey)
                            .font(.system(.body, design: .monospaced))
                    } else {
                        SecureField("sk-...", text: $apiKey)
                            .font(.system(.body, design: .monospaced))
                    }

                    Button {
                        showKey.toggle()
                    } label: {
                        Image(systemName: showKey ? "eye.slash" : "eye")
                    }
                    .buttonStyle(.borderless)
                }

                HStack {
                    Button("Save Key") {
                        saveAPIKey()
                    }
                    .disabled(apiKey.isEmpty)

                    if hasKey {
                        Button("Remove Key", role: .destructive) {
                            removeAPIKey()
                        }
                    }

                    Spacer()

                    if let status = saveStatus {
                        Text(status)
                            .font(.caption)
                            .foregroundStyle(status.contains("Error") ? .red : .green)
                    }
                }

                if hasKey {
                    Label("API key is stored securely in Keychain", systemImage: "lock.shield")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Section("Model") {
                Picker("Model", selection: $selectedModel) {
                    ForEach(availableModels, id: \.self) { model in
                        Text(model).tag(model)
                    }
                }
                .onChange(of: selectedModel) { _, newValue in
                    settings.selectedModel = newValue
                    try? modelContext.save()
                }
            }
        }
        .formStyle(.grouped)
        .padding()
        .onAppear {
            hasKey = KeychainService.load(key: "OPENAI_API_KEY") != nil
            selectedModel = settings.selectedModel
        }
    }

    private func saveAPIKey() {
        do {
            try KeychainService.save(key: "OPENAI_API_KEY", value: apiKey)
            hasKey = true
            apiKey = ""
            saveStatus = "Saved"
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                saveStatus = nil
            }
        } catch {
            saveStatus = "Error: \(error.localizedDescription)"
        }
    }

    private func removeAPIKey() {
        do {
            try KeychainService.delete(key: "OPENAI_API_KEY")
            hasKey = false
            apiKey = ""
            saveStatus = "Removed"
            DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                saveStatus = nil
            }
        } catch {
            saveStatus = "Error: \(error.localizedDescription)"
        }
    }
}
