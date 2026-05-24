import { isLandscapeMedia } from './media-aspect';

/** Fixed landscape ad frame (all slots): 572×358, 16:10 */
export const LANDSCAPE_FRAME_MAX_WIDTH_PX = 572;
export const LANDSCAPE_FRAME_ASPECT = '16 / 10';

/** Fixed portrait ad frame height; width from upload aspect ratio */
export const PORTRAIT_FRAME_HEIGHT_PX = 413;

export interface PortraitFrameSize {
  widthPx: number;
  heightPx: number;
}

/** Portrait frame dimensions used on every portrait upload site-wide */
export function getPortraitFrameSize(
  naturalWidth = 0,
  naturalHeight = 0
): PortraitFrameSize {
  const heightPx = PORTRAIT_FRAME_HEIGHT_PX;
  const widthPx =
    naturalWidth > 0 && naturalHeight > 0
      ? Math.round(heightPx * (naturalWidth / naturalHeight))
      : Math.round(heightPx * 0.75);
  return { widthPx, heightPx };
}

export function isPortraitMedia(width: number, height: number): boolean {
  return width > 0 && height > 0 && !isLandscapeMedia(width, height);
}

/** Hover floating preview scale vs in-page ad frame (30% above 1.4×) */
export const HOVER_PREVIEW_SCALE = 1.82;

const LANDSCAPE_HEIGHT_PX = Math.round(
  LANDSCAPE_FRAME_MAX_WIDTH_PX / (16 / 10)
);

export function getHoverLandscapePreviewSize(): PortraitFrameSize {
  return {
    widthPx: Math.round(LANDSCAPE_FRAME_MAX_WIDTH_PX * HOVER_PREVIEW_SCALE),
    heightPx: Math.round(LANDSCAPE_HEIGHT_PX * HOVER_PREVIEW_SCALE),
  };
}

export function getHoverPortraitPreviewSize(
  naturalWidth = 0,
  naturalHeight = 0
): PortraitFrameSize {
  const base = getPortraitFrameSize(naturalWidth, naturalHeight);
  return {
    widthPx: Math.round(base.widthPx * HOVER_PREVIEW_SCALE),
    heightPx: Math.round(base.heightPx * HOVER_PREVIEW_SCALE),
  };
}
