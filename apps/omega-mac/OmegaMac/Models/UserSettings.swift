import Foundation
import SwiftData

@Model
final class UserSettings {
    var id: UUID
    var systemPrompt: String?
    var selectedModel: String
    var pinnedToolIds: [String]

    init() {
        self.id = UUID()
        self.systemPrompt = nil
        self.selectedModel = "gpt-4.1-mini"
        self.pinnedToolIds = []
    }
}
