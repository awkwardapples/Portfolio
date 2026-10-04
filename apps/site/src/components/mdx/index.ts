/**
 * Components available in every MDX body without an import (spec T.2,
 * docs/authoring-guide.md): `<Figure>`, `<Video>`, `<Audio>`, `<YouTube>`,
 * `<Spotify>` and `<Aside>`, plus the paragraph override that turns lone
 * links and images into embeds, document cards and figures.
 */
import Figure from '~/components/Figure.astro';
import Audio from '~/components/media/Audio.astro';
import Spotify from '~/components/media/Spotify.astro';
import Video from '~/components/media/Video.astro';
import YouTube from '~/components/media/YouTube.astro';

import Aside from './Aside.astro';
import Paragraph from './Paragraph.astro';

export const mdxComponents = { p: Paragraph, Figure, Video, Audio, YouTube, Spotify, Aside };
