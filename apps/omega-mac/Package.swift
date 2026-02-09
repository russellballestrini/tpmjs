// swift-tools-version: 5.10
import PackageDescription

let package = Package(
    name: "OmegaMac",
    platforms: [.macOS(.v14)],
    dependencies: [
        .package(url: "https://github.com/gonzalezreal/swift-markdown-ui", from: "2.4.0"),
    ],
    targets: [
        .executableTarget(
            name: "OmegaMac",
            dependencies: [
                .product(name: "MarkdownUI", package: "swift-markdown-ui"),
            ],
            path: "OmegaMac"
        ),
    ]
)
