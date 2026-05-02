/**
 * Apple discipline removed mesh gradients (single drop-shadow on product imagery
 * is the only visual elevation). This component is now a no-op for backward
 * compatibility with any old imports — returns null.
 *
 * Do not re-add gradients here. The Apple system uses surface-color tile
 * alternation as its rhythm, not soft glows.
 */
type MeshGradientProps = {
  variant?: 'hero' | 'section' | 'cta';
  className?: string;
};

// biome-ignore lint/correctness/noUnusedFunctionParameters: kept for API compatibility
export function MeshGradient(_props: MeshGradientProps) {
  return null;
}
