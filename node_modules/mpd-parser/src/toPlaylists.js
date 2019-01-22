import { merge } from './utils/object';
import { segmentsFromTemplate } from './segment/segmentTemplate';
import { segmentsFromList } from './segment/segmentList';
import { segmentsFromBase } from './segment/segmentBase';

export const generateSegments = ({ attributes, segmentInfo }) => {
  let segmentAttributes;
  let segmentsFn;

  if (segmentInfo.template) {
    segmentsFn = segmentsFromTemplate;
    segmentAttributes = merge(attributes, segmentInfo.template);
  } else if (segmentInfo.base) {
    segmentsFn = segmentsFromBase;
    segmentAttributes = merge(attributes, segmentInfo.base);
  } else if (segmentInfo.list) {
    segmentsFn = segmentsFromList;
    segmentAttributes = merge(attributes, segmentInfo.list);
  }

  if (!segmentsFn) {
    return { attributes };
  }

  const segments = segmentsFn(segmentAttributes, segmentInfo.timeline);

  // The @duration attribute will be used to determin the playlist's targetDuration which
  // must be in seconds. Since we've generated the segment list, we no longer need
  // @duration to be in @timescale units, so we can convert it here.
  if (segmentAttributes.duration) {
    const { duration, timescale = 1 } = segmentAttributes;

    segmentAttributes.duration = duration / timescale;
  } else if (segments.length) {
    // if there is no @duration attribute, use the largest segment duration as
    // as target duration
    segmentAttributes.duration = segments.reduce((max, segment) => {
      return Math.max(max, Math.ceil(segment.duration));
    }, 0);
  } else {
    segmentAttributes.duration = 0;
  }

  return {
    attributes: segmentAttributes,
    segments
  };
};

export const toPlaylists = (representations) => representations.map(generateSegments);
