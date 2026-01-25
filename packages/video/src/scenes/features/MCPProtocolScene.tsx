import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import { colors, typography, springConfigs } from '../../design-tokens';

/**
 * Feature 5: MCP Protocol (0:40 - 0:49)
 * Works with Claude Desktop, Cursor, Windsurf, and any MCP client
 */

const ClientLogo = ({
  name,
  delay,
  connected,
}: {
  name: string;
  delay: number;
  connected: boolean;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.bouncy,
  });

  const connectionProgress = spring({
    frame: frame - delay - fps * 0.5,
    fps,
    config: springConfigs.snappy,
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [30, 0])}px)`,
      }}
    >
      <div
        style={{
          width: 80,
          height: 80,
          backgroundColor: colors.bg.surface2,
          border: `2px ${connected ? 'solid' : 'dashed'} ${connected ? colors.status.success : colors.border.default}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: connected ? colors.status.success : colors.text.secondary,
          boxShadow: connected ? `0 0 20px ${colors.status.successMuted}` : 'none',
        }}
      >
        {name[0]}
      </div>
      <div
        style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.secondary,
        }}
      >
        {name}
      </div>
      {connected && (
        <div
          style={{
            fontSize: typography.fontSize.xs,
            color: colors.status.success,
            fontFamily: typography.fontFamily.mono,
            opacity: connectionProgress,
          }}
        >
          connected
        </div>
      )}
    </div>
  );
};

export const MCPProtocolScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const urlProgress = spring({
    frame: frame - fps * 2,
    fps,
    config: springConfigs.snappy,
  });

  const clients = [
    { name: 'Claude', connected: true },
    { name: 'Cursor', connected: true },
    { name: 'Windsurf', connected: true },
    { name: 'Any MCP', connected: false },
  ];

  // Connection line animation
  const lineProgress = interpolate(frame, [fps * 3, fps * 5], [0, 1], {
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
          🔗
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
            Feature 05
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            MCP Protocol
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
          universal
        </div>
      </div>

      {/* Center URL box */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '45%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            padding: '20px 40px',
            backgroundColor: colors.bg.surface,
            border: `2px solid ${colors.copper.default}`,
            marginBottom: 24,
            opacity: urlProgress,
            transform: `scale(${interpolate(urlProgress, [0, 1], [0.9, 1])})`,
            boxShadow: `0 0 30px ${colors.copper.glow}`,
          }}
        >
          <div
            style={{
              fontSize: typography.fontSize.xs,
              color: colors.text.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: typography.letterSpacing.widest,
            }}
          >
            MCP Server URL
          </div>
          <div
            style={{
              fontFamily: typography.fontFamily.mono,
              fontSize: typography.fontSize.xl,
              color: colors.copper.default,
            }}
          >
            tpmjs.com/mcp
          </div>
        </div>

        <div
          style={{
            fontSize: typography.fontSize.lg,
            color: colors.text.secondary,
            opacity: urlProgress,
          }}
        >
          One URL. Instant access to all tools.
        </div>
      </div>

      {/* Client logos */}
      <div
        style={{
          position: 'absolute',
          bottom: 120,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          gap: 60,
        }}
      >
        {clients.map((client, i) => (
          <ClientLogo
            key={client.name}
            {...client}
            delay={fps * 1 + i * 8}
          />
        ))}
      </div>

      {/* Connection lines */}
      <svg
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
        }}
        viewBox="0 0 1920 1080"
      >
        {clients.slice(0, 3).map((_, i) => {
          const startX = 480 + i * 320;
          const startY = 820;
          const endX = 960;
          const endY = 520;

          const path = `M ${startX} ${startY} Q ${startX} ${(startY + endY) / 2} ${endX} ${endY}`;
          const pathLength = 400; // Approximate

          return (
            <path
              key={i}
              d={path}
              fill="none"
              stroke={colors.copper.default}
              strokeWidth={2}
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength * (1 - lineProgress)}
              opacity={0.5}
            />
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};
