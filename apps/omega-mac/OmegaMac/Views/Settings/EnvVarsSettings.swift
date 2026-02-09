import SwiftData
import SwiftUI

struct EnvVarsSettings: View {
    @Query(sort: \EnvVar.keyName) private var envVars: [EnvVar]
    @Environment(\.modelContext) private var modelContext

    @State private var newKeyName: String = ""
    @State private var newKeyValue: String = ""
    @State private var errorMessage: String?

    var body: some View {
        Form {
            Section("Stored Environment Variables") {
                if envVars.isEmpty {
                    Text("No environment variables configured.")
                        .font(.callout)
                        .foregroundStyle(.secondary)
                        .padding(.vertical, 4)
                } else {
                    ForEach(envVars) { envVar in
                        HStack {
                            VStack(alignment: .leading) {
                                Text(envVar.keyName)
                                    .font(.system(.body, design: .monospaced))
                                Text("....\(envVar.valueHint)")
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }

                            Spacer()

                            Button(role: .destructive) {
                                deleteEnvVar(envVar)
                            } label: {
                                Image(systemName: "trash")
                                    .foregroundStyle(.red)
                            }
                            .buttonStyle(.borderless)
                        }
                    }
                }
            }

            Section("Add New") {
                TextField("Key name (e.g., WEATHER_API_KEY)", text: $newKeyName)
                    .font(.system(.body, design: .monospaced))

                SecureField("Value", text: $newKeyValue)
                    .font(.system(.body, design: .monospaced))

                HStack {
                    Button("Add") {
                        addEnvVar()
                    }
                    .disabled(newKeyName.isEmpty || newKeyValue.isEmpty)

                    if let error = errorMessage {
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                }
            }

            Section {
                Label(
                    "Values are stored in macOS Keychain. Only key names are visible in the app.",
                    systemImage: "lock.shield"
                )
                .font(.caption)
                .foregroundStyle(.secondary)

                Label(
                    "All environment variables are passed to tool executions automatically.",
                    systemImage: "info.circle"
                )
                .font(.caption)
                .foregroundStyle(.secondary)
            }
        }
        .formStyle(.grouped)
        .padding()
    }

    private func addEnvVar() {
        let name = newKeyName.trimmingCharacters(in: .whitespacesAndNewlines).uppercased()
        let value = newKeyValue

        guard !name.isEmpty, !value.isEmpty else { return }

        // Check for duplicates
        if envVars.contains(where: { $0.keyName == name }) {
            // Update existing
            do {
                try KeychainService.save(key: name, value: value)
                if let existing = envVars.first(where: { $0.keyName == name }) {
                    existing.valueHint = String(value.suffix(4))
                }
                try? modelContext.save()
                newKeyName = ""
                newKeyValue = ""
                errorMessage = nil
            } catch {
                errorMessage = error.localizedDescription
            }
            return
        }

        do {
            try KeychainService.save(key: name, value: value)

            let hint = String(value.suffix(4))
            let envVar = EnvVar(keyName: name, valueHint: hint)
            modelContext.insert(envVar)
            try? modelContext.save()

            newKeyName = ""
            newKeyValue = ""
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deleteEnvVar(_ envVar: EnvVar) {
        try? KeychainService.delete(key: envVar.keyName)
        modelContext.delete(envVar)
        try? modelContext.save()
    }
}
