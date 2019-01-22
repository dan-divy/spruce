(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.pkcs7 = global.pkcs7 || {}, global.pkcs7.unpad = factory());
}(this, (function () { 'use strict';

/**
 * Returns the subarray of a Uint8Array without PKCS#7 padding.
 * @param padded {Uint8Array} unencrypted bytes that have been padded
 * @return {Uint8Array} the unpadded bytes
 * @see http://tools.ietf.org/html/rfc5652
 */
function unpad(padded) {
  return padded.subarray(0, padded.byteLength - padded[padded.byteLength - 1]);
}

return unpad;

})));
