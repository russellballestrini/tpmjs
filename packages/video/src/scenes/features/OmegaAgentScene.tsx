import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { colors, springConfigs, typography } from '../../design-tokens';

/**
 * Feature 2: Omega Agent (0:15 - 0:24)
 * AI that dynamically discovers and executes tools
 */

const Message = ({
  sender,
  content,
  delay,
}: {
  sender: 'user' | 'assistant';
  content: string;
  delay: number;
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.snappy,
  });

  const isUser = sender === 'user';

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
        opacity: progress,
        transform: `translateY(${interpolate(progress, [0, 1], [15, 0])}px)`,
      }}
    >
      <div
        style={{
          maxWidth: 420,
          padding: '14px 18px',
          backgroundColor: isUser ? colors.copper.default : colors.bg.surface2,
          border: isUser ? 'none' : `1px dashed ${colors.border.default}`,
          color: isUser ? colors.white : colors.text.primary,
          fontSize: typography.fontSize.base,
          lineHeight: typography.lineHeight.relaxed,
        }}
      >
        {content}
      </div>
    </div>
  );
};

const ToolPill = ({ name, delay }: { name: string; delay: number }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - delay,
    fps,
    config: springConfigs.bouncy,
  });

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        backgroundColor: colors.bg.surface,
        border: `1px solid ${colors.status.success}`,
        marginRight: 8,
        opacity: progress,
        transform: `scale(${interpolate(progress, [0, 1], [0.7, 1])})`,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: colors.status.success,
        }}
      />
      <span
        style={{
          fontFamily: typography.fontFamily.mono,
          fontSize: typography.fontSize.xs,
          color: colors.status.success,
        }}
      >
        {name}
      </span>
    </div>
  );
};

export const OmegaAgentScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const headerProgress = spring({
    frame,
    fps,
    config: springConfigs.smooth,
  });

  const selectedTools = ['web-scraper', 'sentiment', 'chart-gen'];

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
          🧩
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
            Feature 02
          </div>
          <div
            style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.bold,
              color: colors.text.primary,
            }}
          >
            Omega Agent
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
          LIVE
        </div>
      </div>

      {/* Chat interface */}
      <div
        style={{
          marginTop: 160,
          maxWidth: 700,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <Message
          sender="user"
          content="Scrape competitor pricing pages and create a comparison chart"
          delay={fps * 0.5}
        />

        {/* Tool selection */}
        {frame > fps * 1.5 && (
          <div
            style={{
              marginBottom: 16,
              marginLeft: 8,
              opacity: interpolate(frame, [fps * 1.5, fps * 2], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              }),
            }}
          >
            <div
              style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.muted,
                marginBottom: 8,
              }}
            >
              Auto-selected tools:
            </div>
            <div>
              {selectedTools.map((tool, i) => (
                <ToolPill key={tool} name={tool} delay={fps * 2 + i * 6} />
              ))}
            </div>
          </div>
        )}

        <Message
          sender="assistant"
          content="I've scraped 5 competitor pages and generated a comparison chart. Found 23% average price difference..."
          delay={fps * 3.5}
        />
      </div>

      {/* Bottom highlight */}
      <div
        style={{
          position: 'absolute',
          bottom: 80,
          left: 0,
          right: 0,
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
          No configuration needed. <span style={{ color: colors.copper.default }}>Just ask.</span>
        </span>
      </div>
    </AbsoluteFill>
  );
};
