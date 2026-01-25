import { Composition } from 'remotion';
import { ExplainerVideo } from './ExplainerVideo';

export const RemotionRoot = () => {
  return (
    <Composition
      id="TPMJSExplainer"
      component={ExplainerVideo}
      durationInFrames={9000}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
