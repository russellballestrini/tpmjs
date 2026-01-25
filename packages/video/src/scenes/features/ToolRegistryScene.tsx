import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, typography, springConfigs } from '../../design-tokens';

/**
 * Feature 1: Tool Registry (0:06 - 0:15)
 * Browse 1M+ AI tools from npm
 */

const ToolCard = ({
  name,
  downloads,
  score,
  delay,
}: {
  name: string;
  downloads: string;
  score: number;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  return (
    <div
      style={{
        padding: '16px 20px',
        backgroundColor: colors.bg.surface2,
        border: `1px dashed ${colors.border.default}`,
        marginBottom: 12,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-30, 0])}px)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.base,
            color: colors.text.primary,
            marginBottom: 4,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.muted,
          }}
        >
          {downloads} downloads/mo
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 60,
            height: 6,
            backgroundColor: colors.bg.surface,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${score}%`,
              height: '100%',
              backgroundColor: colors.copper.default,
            }}
          />
        </div>
        <span
          style={{
            fontFamily: typography.fontFamily.mono,
            fontSize: typography.fontSize.sm,
            color: colors.copper.default,
          }}
        >
          {score}%
        </span>
      </div>
    </div>
  );
};

export const ToolRegistryScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const counterValue = Math.floor(
    interpolate(frame, [fps * 0.5, fps * 3], [0, 1847293], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const tools = [
    { name: '@anthropic/claude-sdk', downloads: '2.1M', score: 98 },
    { name: 'firecrawl-aisdk', downloads: '847K', score: 95 },
    { name: 'openai-tool-kit', downloads: '1.2M', score: 92 },
    { name: 'langchain-tools', downloads: '654K', score: 89 },
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.bg.base,
        fontFamily: typography.fontFamily.sans,
        padding: 80,
      }}
    >
      {/* Feature badge */}
      <div
        style={{
          position: 'absolute',
          top: 60,
          left: 80,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          opacity: headerProgress,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.copper.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
        >
          🔍
        </div>
        <div>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.copper.default,
              letterSpacing: typography.letterSpacing.widest,
              textTransform: 'uppercase',
            }}
          >
            Feature 01
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Tool Registry
          </div>
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          gap: 80,
          marginTop: 160,
          alignItems: 'flex-start',
        }}
      >
        {/* Left - Stats */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: typography.fontSize['7xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.mono,
              color: colors.copper.default,
              marginBottom: 16,
              opacity: headerProgress,
            }}
          >
            {counterValue.toLocaleString()}+
          </div>
          <div
            style={{
              fontSize: typography.fontSize.xl,
              color: colors.text.secondary,
              marginBottom: 32,
              opacity: headerProgress,
            }}
          >
            AI tools auto-discovered from npm
          </div>

          {/* Badges */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              flexWrap: 'wrap',
              opacity: interpolate(frame, [fps * 2, fps * 3], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            {['auto-sync', 'quality scores', 'health monitoring'].map((badge) => (
              <div
                key={badge}
                style={{
                  padding: '8px 16px',
                  border: `1px dashed ${colors.border.default}`,
                  fontSize: typography.fontSize.sm,
                  color: colors.text.secondary,
                  textTransform: 'lowercase',
                  fontFamily: typography.fontFamily.mono,
                }}
              >
                {badge}
              </div>
            ))}
          </div>
        </div>

        {/* Right - Tool list */}
        <div style={{ flex: 1, maxWidth: 500 }}>
          {tools.map((tool, i) => (
            <ToolCard
              key={tool.name}
              {...tool}
              delay={fps * 1 + i * 10}
            />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          opacity: interpolate(frame, [fps * 5, fps * 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
          }}
        >
          Updated within minutes of npm publication
        </span>
      </div>
    </AbsoluteFill>
  );
};
