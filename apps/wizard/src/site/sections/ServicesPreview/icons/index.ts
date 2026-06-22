import type { ComponentType } from 'react';

import { FencingIcon } from './Fencing';
import { DeckingIcon } from './Decking';
import { PaintingIcon } from './Painting';
import { PatioIcon } from './Patio';
import { DrivewayIcon } from './Driveway';
import { StepsIcon } from './Steps';
import { JetwashIcon } from './Jetwash';
import { GeneralRepairsIcon } from './GeneralRepairs';
import { PlumbingIcon } from './Plumbing';
import { ElectricalIcon } from './Electrical';
import { CarpentryIcon } from './Carpentry';

export type ServiceIcon = ComponentType<{ className?: string }>;

/**
 * Maps service ID strings (as used in ServicesPreviewItem.iconOrImage) to their
 * inline SVG icon components. The Layout resolves the icon by key at render time.
 * Content files stay as plain .ts — they pass a string key, not a component.
 */
export const ICON_MAP: Readonly<Record<string, ServiceIcon>> = Object.freeze({
  fencing: FencingIcon,
  decking: DeckingIcon,
  painting: PaintingIcon,
  patio: PatioIcon,
  driveway: DrivewayIcon,
  steps: StepsIcon,
  jetwash: JetwashIcon,
  'general-repairs': GeneralRepairsIcon,
  plumbing: PlumbingIcon,
  electrical: ElectricalIcon,
  carpentry: CarpentryIcon,
});

export {
  FencingIcon,
  DeckingIcon,
  PaintingIcon,
  PatioIcon,
  DrivewayIcon,
  StepsIcon,
  JetwashIcon,
  GeneralRepairsIcon,
  PlumbingIcon,
  ElectricalIcon,
  CarpentryIcon,
};
