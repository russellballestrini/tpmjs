import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Feature 8: Living Skills (1:05 - 1:13)
 * Documentation that evolves from real usage
 */

const SkillNode = ({
  label,
  x,
  y,
  delay,
  size = 'md',
}: {
  label: string;
  x: number;
  y: number;
  delay: number;
  size?: 'sm' | 'md' | 'lg';
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.bouncy,
  });

  const sizes = {
    sm: { w: 100, h: 40, font: typography.fontSize.xs },
    md: { w: 140, h: 50, font: typography.fontSize.sm },
    lg: { w: 180, h: 60, font: typography.fontSize.base },
  };

  const s = sizes[size];

  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: s.w,
        height: s.h,
        backgroundColor: size === 'lg' ? colors.copper.default : colors.bg.surface2,
        border: `1px ${size === 'lg' ? 'solid' : 'dashed'} ${size === 'lg' ? colors.copper.default : colors.border.default}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.5, 1])})`,
        boxShadow: size === 'lg' ? `0 0 30px ${colors.copper.glow}` : 'none',
      }}
    >
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: s.font,
          color: size === 'lg' ? colors.white : colors.text.primary,
          textAlign: 'center',
        }}
      >
        {label}
      </span>
    </div>
  );
};

export const LivingSkillsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  // Skill nodes with positions
  const skills = [
    { label: 'API Design', x: 800, y: 300, size: 'lg' as const, delay: fps * 1 },
    { label: 'Error Handling', x: 600, y: 200, size: 'md' as const, delay: fps * 1.5 },
    { label: 'Rate Limits', x: 1000, y: 200, size: 'md' as const, delay: fps * 1.8 },
    { label: 'Caching', x: 550, y: 400, size: 'sm' as const, delay: fps * 2.2 },
    { label: 'Auth', x: 700, y: 450, size: 'sm' as const, delay: fps * 2.5 },
    { label: 'Webhooks', x: 950, y: 420, size: 'sm' as const, delay: fps * 2.8 },
    { label: 'Pagination', x: 1100, y: 350, size: 'sm' as const, delay: fps * 3 },
  ];

  // Connection lines progress
  const linesProgress = interpolate(frame, [fps * 3, fps * 5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
          💬
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
            Feature 08
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Living Skills
          </div>
        </div>
        <div
          style={{
            marginLeft: 16,
            padding: '4px 12px',
            backgroundColor: colors.status.infoMuted,
            border: `1px solid ${colors.status.info}`,
            fontSize: typography.fontSize.xs,
            color: colors.status.info,
            fontFamily: typography.fontFamily.mono,
          }}
        >
          NEW
        </div>
      </div>

      {/* Left description */}
      <div
        style={{
          position: 'absolute',
          left: 80,
          top: 200,
          maxWidth: 400,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            lineHeight: typography.lineHeight.tight,
            marginBottom: 24,
            opacity: headerProgress,
          }}
        >
          Documentation that <span style={{ color: colors.copper.default }}>evolves</span>
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
          Skills emerge from question patterns
          <br />
          and proven behaviors in real usage.
        </div>
      </div>

      {/* Skill graph */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
        viewBox="0 0 1920 1080"
      >
        {/* Connection lines */}
        <g opacity={linesProgress}>
          <line
            x1="870"
            y1="330"
            x2="670"
            y2="225"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="940"
            y1="330"
            x2="1070"
            y2="225"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="840"
            y1="360"
            x2="610"
            y2="420"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="870"
            y1="360"
            x2="750"
            y2="470"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="940"
            y1="360"
            x2="1000"
            y2="440"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <line
            x1="970"
            y1="340"
            x2="1150"
            y2="370"
            stroke={colors.border.default}
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        </g>
      </svg>

      {/* Skill nodes */}
      {skills.map((skill) => (
        <SkillNode key={skill.label} {...skill} />
      ))}

      {/* Bottom quote */}
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
            fontSize: typography.fontSize.lg,
            color: colors.text.muted,
            fontStyle: 'italic',
          }}
        >
          "Skills, proven in the wild — not declared on paper"
        </span>
      </div>
    </AbsoluteFill>
  );
};
