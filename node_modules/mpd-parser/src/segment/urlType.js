import resolveUrl from '../utils/resolveUrl';

/**
 * @typedef {Object} SingleUri
 * @property {string} uri - relative location of segment
 * @property {string} resolvedUri - resolved location of segment
 * @property {Object} byterange - Object containing information on how to make byte range
 *   requests following byte-range-spec per RFC2616.
 * @property {String} byterange.length - length of range request
 * @property {String} byterange.offset - byte offset of range request
 *
 * @see https://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html#sec14.35.1
 */

/**
 * Converts a URLType node (5.3.9.2.3 Table 13) to a segment object
 * that conforms to how m3u8-parser is structured
 *
 * @see https://github.com/videojs/m3u8-parser
 *
 * @param {string} baseUrl - baseUrl provided by <BaseUrl> nodes
 * @param {string} source - source url for segment
 * @param {string} range - optional range used for range calls, follows
 * @return {SingleUri} full segment information transformed into a format similar
 *   to m3u8-parser
 */
export const urlTypeToSegment = ({ baseUrl = '', source = '', range = '' }) => {
  const init = {
    uri: source,
    resolvedUri: resolveUrl(baseUrl || '', source)
  };

  if (range) {
    const ranges = range.split('-');
    const startRange = parseInt(ranges[0], 10);
    const endRange = parseInt(ranges[1], 10);

    init.byterange = {
      length: endRange - startRange,
      offset: startRange
    };
  }

  return init;
};

export default urlTypeToSegment;
