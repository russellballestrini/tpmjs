import SwiftUI

struct SettingsView: View {
    var body: some View {
        TabView {
            APIKeySettings()
                .tabItem {
                    Label("API Key", systemImage: "key")
                }

            EnvVarsSettings()
                .tabItem {
                    Label("Environment", systemImage: "server.rack")
                }

            SystemPromptSettings()
                .tabItem {
                    Label("System Prompt", systemImage: "text.bubble")
                }
        }
        .frame(width: 520, height: 420)
    }
}
