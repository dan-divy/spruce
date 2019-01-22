import errors from '../errors';
import urlTypeConverter from './urlType';
import { parseByDuration } from './durationTimeParser';

/**
 * Translates SegmentBase into a set of segments.
 * (DASH SPEC Section 5.3.9.3.2) contains a set of <SegmentURL> nodes.  Each
 * node should be translated into segment.
 *
 * @param {Object} attributes
 *   Object containing all inherited attributes from parent elements with attribute
 *   names as keys
 * @return {Object.<Array>} list of segments
 */
export const segmentsFromBase = (attributes) => {
  const {
    baseUrl,
    initialization = {},
    sourceDuration,
    timescale = 1,
    indexRange = '',
    duration
  } = attributes;

  // base url is required for SegmentBase to work, per spec (Section 5.3.9.2.1)
  if (!baseUrl) {
    throw new Error(errors.NO_BASE_URL);
  }

  const initSegment = urlTypeConverter({
    baseUrl,
    source: initialization.sourceURL,
    range: initialization.range
  });
  const segment = urlTypeConverter({ baseUrl, source: baseUrl, range: indexRange });

  segment.map = initSegment;

  // If there is a duration, use it, otherwise use the given duration of the source
  // (since SegmentBase is only for one total segment)
  if (duration) {
    const segmentTimeInfo = parseByDuration(attributes);

    if (segmentTimeInfo.length) {
      segment.duration = segmentTimeInfo[0].duration;
      segment.timeline = segmentTimeInfo[0].timeline;
    }
  } else if (sourceDuration) {
    segment.duration = (sourceDuration / timescale);
    segment.timeline = 0;
  }

  // This is used for mediaSequence
  segment.number = 0;

  return [segment];
};
