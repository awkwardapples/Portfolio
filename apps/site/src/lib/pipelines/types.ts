/**
 * A step of an "Under the hood" sequence (spec J.2 item 4, N.5; Pass 11,
 * F.5): one sentence, the real artefacts behind it (code or a trace line,
 * cut at build time), and links to where they live.
 */
export interface PipelineStep {
  title: string;
  text: string;
  links: { href: string; label: string }[];
  artefacts: { caption: string; code: string }[];
}
