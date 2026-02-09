import SwiftData
import SwiftUI

@main
struct OmegaMacApp: App {
    var body: some Scene {
        WindowGroup {
            ContentView()
                .preferredColorScheme(.dark)
        }
        .modelContainer(for: [
            Conversation.self,
            Message.self,
            ToolCallRecord.self,
            EnvVar.self,
            UserSettings.self,
        ])
        .defaultSize(width: 1100, height: 750)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("New Conversation") {
                    NotificationCenter.default.post(
                        name: .newConversation, object: nil)
                }
                .keyboardShortcut("n", modifiers: .command)
            }
        }

        #if os(macOS)
        Settings {
            SettingsView()
                .modelContainer(for: [
                    EnvVar.self,
                    UserSettings.self,
                ])
                .preferredColorScheme(.dark)
        }
        #endif
    }
}

extension Notification.Name {
    static let newConversation = Notification.Name("newConversation")
}
