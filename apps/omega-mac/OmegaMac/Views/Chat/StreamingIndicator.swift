import SwiftUI

struct StreamingIndicator: View {
    @State private var dotCount = 0
    private let timer = Timer.publish(every: 0.4, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 6) {
            Image(systemName: "sparkles")
                .foregroundStyle(Color.accentColor)
                .font(.caption)

            Text("Omega is thinking" + String(repeating: ".", count: dotCount))
                .font(.callout)
                .foregroundStyle(.secondary)
        }
        .padding(12)
        .background(.quaternary.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .onReceive(timer) { _ in
            dotCount = (dotCount + 1) % 4
        }
    }
}
