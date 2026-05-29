import { fieldRegistry } from './field-registry';
import type { FieldRendererProps } from './types';

/** Dispatches to the correct renderer from the closed field registry. */
export function FieldRenderer(props: FieldRendererProps): JSX.Element {
  const Renderer = fieldRegistry[props.field.type];
  return <Renderer {...props} />;
}
