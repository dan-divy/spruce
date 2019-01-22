import { values } from './utils/object';
import { findIndexes } from './utils/list';

const mergeDiscontiguousPlaylists = playlists => {
  const mergedPlaylists = values(playlists.reduce((acc, playlist) => {
    // assuming playlist IDs are the same across periods
    // TODO: handle multiperiod where representation sets are not the same
    // across periods
    const name = playlist.attributes.id + (playlist.attributes.lang || '');

    // Periods after first
    if (acc[name]) {
      // first segment of subsequent periods signal a discontinuity
      playlist.segments[0].discontinuity = true;
      acc[name].segments.push(...playlist.segments);

      // bubble up contentProtection, this assumes all DRM content
      // has the same contentProtection
      if (playlist.attributes.contentProtection) {
        acc[name].attributes.contentProtection =
          playlist.attributes.contentProtection;
      }
    } else {
      // first Period
      acc[name] = playlist;
    }

    return acc;
  }, {}));

  return mergedPlaylists.map(playlist => {
    playlist.discontinuityStarts =
        findIndexes(playlist.segments, 'discontinuity');

    return playlist;
  });
};

export const formatAudioPlaylist = ({ attributes, segments }) => {
  const playlist = {
    attributes: {
      NAME: attributes.id,
      BANDWIDTH: attributes.bandwidth,
      CODECS: attributes.codecs,
      ['PROGRAM-ID']: 1
    },
    uri: '',
    endList: (attributes.type || 'static') === 'static',
    timeline: attributes.periodIndex,
    resolvedUri: '',
    targetDuration: attributes.duration,
    segments,
    mediaSequence: segments.length ? segments[0].number : 1
  };

  if (attributes.contentProtection) {
    playlist.contentProtection = attributes.contentProtection;
  }

  return playlist;
};

export const formatVttPlaylist = ({ attributes, segments }) => {
  if (typeof segments === 'undefined') {
    // vtt tracks may use single file in BaseURL
    segments = [{
      uri: attributes.baseUrl,
      timeline: attributes.periodIndex,
      resolvedUri: attributes.baseUrl || '',
      duration: attributes.sourceDuration,
      number: 0
    }];
    // targetDuration should be the same duration as the only segment
    attributes.duration = attributes.sourceDuration;
  }
  return {
    attributes: {
      NAME: attributes.id,
      BANDWIDTH: attributes.bandwidth,
      ['PROGRAM-ID']: 1
    },
    uri: '',
    endList: (attributes.type || 'static') === 'static',
    timeline: attributes.periodIndex,
    resolvedUri: attributes.baseUrl || '',
    targetDuration: attributes.duration,
    segments,
    mediaSequence: segments.length ? segments[0].number : 1
  };
};

export const organizeAudioPlaylists = playlists => {
  return playlists.reduce((a, playlist) => {
    const role = playlist.attributes.role &&
      playlist.attributes.role.value || 'main';
    const language = playlist.attributes.lang || '';

    let label = 'main';

    if (language) {
      label = `${playlist.attributes.lang} (${role})`;
    }

    // skip if we already have the highest quality audio for a language
    if (a[label] &&
      a[label].playlists[0].attributes.BANDWIDTH >
      playlist.attributes.bandwidth) {
      return a;
    }

    a[label] = {
      language,
      autoselect: true,
      default: role === 'main',
      playlists: [formatAudioPlaylist(playlist)],
      uri: ''
    };

    return a;
  }, {});
};

export const organizeVttPlaylists = playlists => {
  return playlists.reduce((a, playlist) => {
    const label = playlist.attributes.lang || 'text';

    // skip if we already have subtitles
    if (a[label]) {
      return a;
    }

    a[label] = {
      language: label,
      default: false,
      autoselect: false,
      playlists: [formatVttPlaylist(playlist)],
      uri: ''
    };

    return a;
  }, {});
};

export const formatVideoPlaylist = ({ attributes, segments }) => {
  const playlist = {
    attributes: {
      NAME: attributes.id,
      AUDIO: 'audio',
      SUBTITLES: 'subs',
      RESOLUTION: {
        width: attributes.width,
        height: attributes.height
      },
      CODECS: attributes.codecs,
      BANDWIDTH: attributes.bandwidth,
      ['PROGRAM-ID']: 1
    },
    uri: '',
    endList: (attributes.type || 'static') === 'static',
    timeline: attributes.periodIndex,
    resolvedUri: '',
    targetDuration: attributes.duration,
    segments,
    mediaSequence: segments.length ? segments[0].number : 1
  };

  if (attributes.contentProtection) {
    playlist.contentProtection = attributes.contentProtection;
  }

  return playlist;
};

export const toM3u8 = dashPlaylists => {
  if (!dashPlaylists.length) {
    return {};
  }

  // grab all master attributes
  const {
    sourceDuration: duration,
    minimumUpdatePeriod = 0
  } = dashPlaylists[0].attributes;

  const videoOnly = ({ attributes }) =>
    attributes.mimeType === 'video/mp4' || attributes.contentType === 'video';
  const audioOnly = ({ attributes }) =>
    attributes.mimeType === 'audio/mp4' || attributes.contentType === 'audio';
  const vttOnly = ({ attributes }) =>
    attributes.mimeType === 'text/vtt' || attributes.contentType === 'text';

  const videoPlaylists = mergeDiscontiguousPlaylists(
    dashPlaylists.filter(videoOnly)
  ).map(formatVideoPlaylist);
  const audioPlaylists = mergeDiscontiguousPlaylists(dashPlaylists.filter(audioOnly));
  const vttPlaylists = dashPlaylists.filter(vttOnly);

  const master = {
    allowCache: true,
    discontinuityStarts: [],
    segments: [],
    endList: true,
    mediaGroups: {
      AUDIO: {},
      VIDEO: {},
      ['CLOSED-CAPTIONS']: {},
      SUBTITLES: {}
    },
    uri: '',
    duration,
    playlists: videoPlaylists,
    minimumUpdatePeriod: minimumUpdatePeriod * 1000
  };

  if (audioPlaylists.length) {
    master.mediaGroups.AUDIO.audio = organizeAudioPlaylists(audioPlaylists);
  }

  if (vttPlaylists.length) {
    master.mediaGroups.SUBTITLES.subs = organizeVttPlaylists(vttPlaylists);
  }

  return master;
};
