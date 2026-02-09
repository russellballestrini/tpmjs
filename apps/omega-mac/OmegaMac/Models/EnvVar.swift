import Foundation
import SwiftData

@Model
final class EnvVar {
    var id: UUID
    var keyName: String
    /// Last 4 characters of the value (for display hint)
    var valueHint: String
    var createdAt: Date

    init(keyName: String, valueHint: String) {
        self.id = UUID()
        self.keyName = keyName
        self.valueHint = valueHint
        self.createdAt = Date()
    }
}
