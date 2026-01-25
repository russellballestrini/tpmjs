import { Composition } from 'remotion';
import { ExplainerVideo } from './ExplainerVideo';
import { FeaturesVideo } from './FeaturesVideo';

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="TPMJSExplainer"
        component={ExplainerVideo}
        durationInFrames={9000}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="TPMJSFeatures"
        component={FeaturesVideo}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
