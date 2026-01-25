import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, typography, springConfigs } from '../../design-tokens';

/**
 * Feature 6: Secure Execution (0:49 - 0:57)
 * Isolated sandboxes, rate limiting, encrypted credentials
 */

const SecurityLayer = ({
  label,
  icon,
  delay,
  index,
}: {
  label: string;
  icon: string;
  delay: number;
  index: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  const width = 300 - index * 40;

  return (
    <div
      style={{
        width,
        padding: '16px 24px',
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.copper.default}`,
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        marginBottom: 16,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [-20, 0])}px)`,
        boxShadow: `0 ${4 + index * 2}px ${10 + index * 5}px rgba(0,0,0,0.3)`,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
          textTransform: 'lowercase',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const SecureExecutionScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const shieldPulse = Math.sin(frame * 0.1) * 0.1 + 1;

  const layers = [
    { label: 'isolated sandbox', icon: '📦' },
    { label: 'rate limiting', icon: '⏱️' },
    { label: 'timeout handling', icon: '⚡' },
    { label: 'encrypted at rest', icon: '🔐' },
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
          🔑
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
            Feature 06
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Secure Execution
          </div>
        </div>
        <div
          style={{
            marginLeft: 16,
            padding: '4px 12px',
            backgroundColor: colors.status.successMuted,
            border: `1px solid ${colors.status.success}`,
            fontSize: typography.fontSize.xs,
            color: colors.status.success,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          sandboxed
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          display: 'flex',
          gap: 120,
          marginTop: 180,
          alignItems: 'center',
        }}
      >
        {/* Left - Shield visualization */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 200,
              height: 240,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transform: `scale(${shieldPulse})`,
            }}
          >
            {/* Shield shape using CSS */}
            <div
              style={{
                width: 180,
                height: 200,
                backgroundColor: colors.copper.default,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 0 60px ${colors.copper.glow}`,
              }}
            >
              <div
                style={{
                  width: 160,
                  height: 180,
                  backgroundColor: colors.bg.surface,
                  clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: 64 }}>🛡️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Security layers */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {layers.map((layer, i) => (
            <SecurityLayer
              key={layer.label}
              {...layer}
              index={i}
              delay={fps * 1 + i * 10}
            />
          ))}
        </div>
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          right: 80,
          textAlign: 'center',
          opacity: interpolate(frame, [fps * 5, fps * 6], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          }),
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.xl,
            color: colors.text.secondary,
          }}
        >
          Every tool runs in{' '}
          <span style={{ color: colors.copper.default }}>complete isolation</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
