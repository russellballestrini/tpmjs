import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, typography, springConfigs } from '../../design-tokens';

/**
 * Feature 4: Custom Agents (0:32 - 0:40)
 * Build AI agents with your choice of LLM
 */

const AgentCard = ({
  name,
  model,
  tools,
  status,
  delay,
}: {
  name: string;
  model: string;
  tools: number;
  status: 'public' | 'private';
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
        padding: 20,
        backgroundColor: colors.bg.surface,
        border: `1px dashed ${colors.border.default}`,
        width: 280,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.9, 1])})`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            backgroundColor: colors.copper.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: typography.fontWeight.bold,
            color: colors.white,
            fontSize: typography.fontSize.lg,
          }}
        >
          {name[0].toUpperCase()}
        </div>
        <div>
          <div
            style={{
              fontSize: typography.fontSize.base,
              fontWeight: typography.fontWeight.semibold,
              color: colors.text.primary,
            }}
          >
            {name}
          </div>
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
              fontFamily: typography.fontFamily.mono,
            }}
          >
            {model}
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}
        >
          {tools} tools configured
        </span>
        <div
          style={{
            padding: '4px 10px',
            backgroundColor:
              status === 'public' ? colors.status.successMuted : colors.bg.surface2,
            border: `1px solid ${status === 'public' ? colors.status.success : colors.border.default}`,
            fontSize: typography.fontSize.xs,
            color: status === 'public' ? colors.status.success : colors.text.muted,
          }}
        >
          {status}
        </div>
      </div>
    </div>
  );
};

export const CustomAgentsScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const agents = [
    { name: 'Research Bot', model: 'claude-opus-4', tools: 8, status: 'public' as const },
    { name: 'Code Review', model: 'gpt-4o', tools: 5, status: 'private' as const },
    { name: 'Data Analyst', model: 'claude-sonnet-4', tools: 12, status: 'public' as const },
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
          👤
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
            Feature 04
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Custom Agents
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
          unlimited
        </div>
      </div>

      {/* Tagline */}
      <div
        style={{
          marginTop: 180,
          marginBottom: 48,
          opacity: headerProgress,
        }}
      >
        <div
          style={{
            fontSize: typography.fontSize['3xl'],
            fontWeight: typography.fontWeight.semibold,
            color: colors.text.primary,
            lineHeight: typography.lineHeight.tight,
          }}
        >
          Your LLM. Your prompts.
          <br />
          <span style={{ color: colors.copper.default }}>Your tools.</span>
        </div>
      </div>

      {/* Agent cards */}
      <div
        style={{
          display: 'flex',
          gap: 24,
          flexWrap: 'wrap',
        }}
      >
        {agents.map((agent, i) => (
          <AgentCard key={agent.name} {...agent} delay={fps * 1.5 + i * 10} />
        ))}
      </div>

      {/* Bottom text */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 80,
          opacity: interpolate(frame, [fps * 4, fps * 5], [0, 1], {
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
          Share publicly or keep private — your choice
        </span>
      </div>
    </AbsoluteFill>
  );
};
