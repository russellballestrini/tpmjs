import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Feature 7: Test Scenarios (0:57 - 1:05)
 * AI-generated test scenarios, pass rates, execution times
 */

const TestResult = ({
  name,
  status,
  time,
  delay,
}: {
  name: string;
  status: 'pass' | 'fail' | 'running';
  time?: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  const statusColors = {
    pass: colors.status.success,
    fail: colors.status.error,
    running: colors.status.warning,
  };

  const statusIcons = {
    pass: '✓',
    fail: '✕',
    running: '○',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        backgroundColor: colors.bg.surface,
        borderLeft: `3px solid ${statusColors[status]}`,
        marginBottom: 8,
        opacity: progress,
        transform: `translateX(${interpolate(progress, [0, 1], [-20, 0])}px)`,
      }}
    >
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.lg,
          color: statusColors[status],
          width: 24,
        }}
      >
        {statusIcons[status]}
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.sm,
          color: colors.text.primary,
        }}
      >
        {name}
      </span>
      {time && (
        <span
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          {time}
        </span>
      )}
    </div>
  );
};

export const TestScenariosScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  // Animated progress bar
  const passRate = Math.min(
    94,
    interpolate(frame, [fps * 2, fps * 4], [0, 94], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    })
  );

  const tests = [
    { name: 'search_basic_query', status: 'pass' as const, time: '124ms' },
    { name: 'search_with_filters', status: 'pass' as const, time: '89ms' },
    { name: 'handle_empty_results', status: 'pass' as const, time: '45ms' },
    { name: 'validate_api_key', status: 'fail' as const, time: '2.1s' },
    { name: 'rate_limit_handling', status: 'pass' as const, time: '312ms' },
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
          ✓
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
            Feature 07
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Test Scenarios
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
          automated
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
        {/* Left - Pass rate */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
              opacity: headerProgress,
            }}
          >
            Pass Rate
          </div>
          <div
            style={{
              fontSize: typography.fontSize['7xl'],
              fontWeight: typography.fontWeight.bold,
              fontFamily: typography.fontFamily.mono,
              color: colors.status.success,
              marginBottom: 24,
            }}
          >
            {Math.floor(passRate)}%
          </div>

          {/* Progress bar */}
          <div
            style={{
              width: '100%',
              maxWidth: 400,
              height: 12,
              backgroundColor: colors.bg.surface2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${passRate}%`,
                height: '100%',
                backgroundColor: colors.status.success,
              }}
            />
          </div>

          <div
            style={{
              marginTop: 32,
              fontSize: typography.fontSize.lg,
              color: colors.text.secondary,
              lineHeight: typography.lineHeight.relaxed,
              opacity: interpolate(frame, [fps * 2, fps * 3], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            AI-generated tests validate
            <br />
            tool behavior automatically
          </div>
        </div>

        {/* Right - Test results */}
        <div style={{ flex: 1, maxWidth: 500 }}>
          <div
            style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.muted,
              marginBottom: 16,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
            }}
          >
            Recent Tests
          </div>
          {tests.map((test, i) => (
            <TestResult key={test.name} {...test} delay={fps * 1 + i * 8} />
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};
