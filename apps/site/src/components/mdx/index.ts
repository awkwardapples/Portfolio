/**
 * Components available in every MDX body without an import (spec T.2,
 * docs/authoring-guide.md): `<Figure>`, `<Video>`, `<Audio>`, `<YouTube>`,
 * `<Spotify>`, `<Aside>` and `<Endorsement>`, the case-study sections
 * `<LiveDemo>`, `<UnderTheHood>`, `<EngineeringEvidence>` and
 * `<ArbiterEvaluation>`, plus the paragraph override that turns lone links
 * and images into embeds, document cards and figures.
 */
import ArbiterEvaluation from '~/components/case-study/ArbiterEvaluation.astro';
import EngineeringEvidence from '~/components/case-study/EngineeringEvidence.astro';
import Endorsement from '~/components/Endorsement.astro';
import LiveDemo from '~/components/case-study/LiveDemo.astro';
import UnderTheHood from '~/components/case-study/UnderTheHood.astro';
import Figure from '~/components/Figure.astro';
import Audio from '~/components/media/Audio.astro';
import Spotify from '~/components/media/Spotify.astro';
import Video from '~/components/media/Video.astro';
import YouTube from '~/components/media/YouTube.astro';

import Aside from './Aside.astro';
import Paragraph from './Paragraph.astro';

export const mdxComponents = {
  p: Paragraph,
  Figure,
  Video,
  Audio,
  YouTube,
  Spotify,
  Aside,
  Endorsement,
  // The case studies' sections (spec J.2; Pass 11, F.4).
  LiveDemo,
  UnderTheHood,
  EngineeringEvidence,
  ArbiterEvaluation,
};
