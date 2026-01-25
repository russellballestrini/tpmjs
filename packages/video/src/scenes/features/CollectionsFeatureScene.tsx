import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, typography, springConfigs } from '../../design-tokens';

/**
 * Feature 3: Collections (0:24 - 0:32)
 * Curate tool sets for specific use cases
 */

const CollectionCard = ({
  name,
  toolCount,
  category,
  delay,
  isActive = false,
}: {
  name: string;
  toolCount: number;
  category: string;
  delay: number;
  isActive?: boolean;
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
        padding: 20,
        backgroundColor: isActive ? colors.bg.surface2 : colors.bg.surface,
        border: `1px ${isActive ? 'solid' : 'dashed'} ${isActive ? colors.copper.default : colors.border.default}`,
        marginBottom: 12,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [20, 0])}px) scale(${isActive ? 1.02 : 1})`,
        boxShadow: isActive ? `0 0 20px ${colors.copper.glow}` : 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: isActive ? colors.copper.default : colors.text.primary,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {name}
        </div>
        <div
          style={{
            padding: '4px 10px',
            backgroundColor: colors.bg.surface2,
            border: `1px dashed ${colors.border.default}`,
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            textTransform: 'lowercase',
          }}
        >
          {category}
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
            display: 'flex',
            gap: 4,
          }}
        >
          {Array.from({ length: Math.min(toolCount, 5) }).map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                backgroundColor: colors.copper.muted,
                opacity: 0.6 + i * 0.1,
              }}
            />
          ))}
          {toolCount > 5 && (
            <span
              style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.muted,
                marginLeft: 4,
              }}
            >
              +{toolCount - 5}
            </span>
          )}
        </div>
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {toolCount} tools
        </span>
      </div>
    </div>
  );
};

export const CollectionsFeatureScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const collections = [
    { name: 'data-science-kit', toolCount: 12, category: 'analytics' },
    { name: 'content-creation', toolCount: 8, category: 'marketing' },
    { name: 'devops-automation', toolCount: 15, category: 'infra' },
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
          📁
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
            Feature 03
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Collections
          </div>
        </div>
        <div
          style={{
            marginLeft: 16,
            padding: '4px 12px',
            backgroundColor: colors.bg.surface2,
            border: `1px dashed ${colors.border.default}`,
            fontSize: typography.fontSize.xs,
            color: colors.text.secondary,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          shareable
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
        {/* Left - Description */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: typography.fontSize['3xl'],
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
              marginBottom: 24,
              lineHeight: typography.lineHeight.tight,
              opacity: headerProgress,
            }}
          >
            Curate tool sets
            <br />
            for specific{' '}
            <span style={{ color: colors.copper.default }}>use cases</span>
          </div>
          <div
            style={{
              fontSize: typography.fontSize.lg,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              opacity: interpolate(frame, [fps * 1, fps * 2], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            Add test scenarios to validate behavior.
            <br />
            Generate living documentation automatically.
          </div>
        </div>

        {/* Right - Collection cards */}
        <div style={{ flex: 1, maxWidth: 400 }}>
          {collections.map((collection, i) => (
            <CollectionCard
              key={collection.name}
              {...collection}
              delay={fps * 1 + i * 12}
              isActive={i === 0}
            />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
