'use strict';
var SetHelpers = require('../internals/set-helpers');
var iterate = require('../internals/set-iterate');
var size = require('../internals/set-size');
var getSetRecord = require('../internals/get-set-record');
var iterateSimple = require('../internals/iterate-simple');

var aSet = SetHelpers.aSet;
var has = SetHelpers.has;

// `Set.prototype.isDisjointFrom` method
// https://tc39.github.io/proposal-set-methods/#Set.prototype.isDisjointFrom
module.exports = function isDisjointFrom(other) {
  var O = aSet(this);
  var otherRec = getSetRecord(other);
  return false !== (size(O) <= otherRec.size
    ? iterate(O, function (e) {
      if (otherRec.includes(e)) return false;
    }, true)
    : iterateSimple(otherRec.getIterator(), function (e) {
      if (has(O, e)) return false;
    })
  );
};