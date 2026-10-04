/**
 * Components available in every MDX body without an import (spec T.2,
 * docs/authoring-guide.md): `<Figure>`, `<Video>`, `<Audio>`, `<YouTube>`,
 * `<Spotify>` and `<Aside>`, the case-study sections `<LiveSite>`,
 * `<UnderTheHood>` and `<EngineeringEvidence>`, plus the paragraph override
 * that turns lone links and images into embeds, document cards and figures.
 */
import EngineeringEvidence from '~/components/case-study/EngineeringEvidence.astro';
import LiveSite from '~/components/case-study/LiveSite.astro';
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
  // The GrowTrades case study's sections (spec J.2).
  LiveSite,
  UnderTheHood,
  EngineeringEvidence,
};
