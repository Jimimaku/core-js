/* eslint-disable sonarjs/no-element-overwrite -- required for testing */

import { DESCRIPTORS, GLOBAL, NATIVE } from '../helpers/constants.js';
import { createIterable, is, nativeSubclass } from '../helpers/helpers.js';

const Symbol = GLOBAL.Symbol || {};
const { getOwnPropertyDescriptor, keys, getOwnPropertyNames, getOwnPropertySymbols, freeze } = Object;
const { ownKeys } = GLOBAL.Reflect || {};

QUnit.test('Map', assert => {
  assert.isFunction(Map);
  assert.arity(Map, 0);
  assert.name(Map, 'Map');
  assert.looksNative(Map);
  assert.true('clear' in Map.prototype, 'clear in Map.prototype');
  assert.true('delete' in Map.prototype, 'delete in Map.prototype');
  assert.true('forEach' in Map.prototype, 'forEach in Map.prototype');
  assert.true('get' in Map.prototype, 'get in Map.prototype');
  assert.true('has' in Map.prototype, 'has in Map.prototype');
  assert.true('set' in Map.prototype, 'set in Map.prototype');
  assert.true(new Map() instanceof Map, 'new Map instanceof Map');
  assert.same(new Map(createIterable([[1, 1], [2, 2], [3, 3]])).size, 3, 'Init from iterable');
  assert.same(new Map([[freeze({}), 1], [2, 3]]).size, 2, 'Support frozen objects');
  let done = false;
  try {
    new Map(createIterable([null, 1, 2], {
      return() {
        return done = true;
      },
    }));
  } catch { /* empty */ }
  assert.true(done, '.return #throw');
  const array = [];
  done = false;
  array['@@iterator'] = undefined;
  array[Symbol.iterator] = function () {
    done = true;
    return [][Symbol.iterator].call(this);
  };
  new Map(array);
  assert.true(done);
  const object = {};
  new Map().set(object, 1);
  if (DESCRIPTORS) {
    const results = [];
    for (const key in object) results.push(key);
    assert.arrayEqual(results, []);
    assert.arrayEqual(keys(object), []);
  }
  assert.arrayEqual(getOwnPropertyNames(object), []);
  if (getOwnPropertySymbols) assert.arrayEqual(getOwnPropertySymbols(object), []);
  if (ownKeys) assert.arrayEqual(ownKeys(object), []);
  if (nativeSubclass) {
    const Subclass = nativeSubclass(Map);
    assert.true(new Subclass() instanceof Subclass, 'correct subclassing with native classes #1');
    assert.true(new Subclass() instanceof Map, 'correct subclassing with native classes #2');
    assert.same(new Subclass().set(1, 2).get(1), 2, 'correct subclassing with native classes #3');
  }

  const buffer = new ArrayBuffer(8);
  const map = new Map([[buffer, 8]]);
  assert.true(map.has(buffer), 'works with ArrayBuffer keys');
});

QUnit.test('Map#clear', assert => {
  assert.isFunction(Map.prototype.clear);
  assert.arity(Map.prototype.clear, 0);
  assert.name(Map.prototype.clear, 'clear');
  assert.looksNative(Map.prototype.clear);
  assert.nonEnumerable(Map.prototype, 'clear');
  let map = new Map();
  map.clear();
  assert.same(map.size, 0);
  map = new Map();
  map.set(1, 2);
  map.set(2, 3);
  map.set(1, 4);
  map.clear();
  assert.same(map.size, 0);
  assert.false(map.has(1));
  assert.false(map.has(2));
  const frozen = freeze({});
  map = new Map();
  map.set(1, 2);
  map.set(frozen, 3);
  map.clear();
  assert.same(map.size, 0, 'Support frozen objects');
  assert.false(map.has(1));
  assert.false(map.has(frozen));
});

QUnit.test('Map#delete', assert => {
  assert.isFunction(Map.prototype.delete);
  assert.arity(Map.prototype.delete, 1);
  if (NATIVE) assert.name(Map.prototype.delete, 'delete');
  assert.looksNative(Map.prototype.delete);
  assert.nonEnumerable(Map.prototype, 'delete');
  const object = {};
  const map = new Map();
  map.set(NaN, 1);
  map.set(2, 1);
  map.set(3, 7);
  map.set(2, 5);
  map.set(1, 4);
  map.set(object, 9);
  assert.same(map.size, 5);
  assert.true(map.delete(NaN));
  assert.same(map.size, 4);
  assert.false(map.delete(4));
  assert.same(map.size, 4);
  map.delete([]);
  assert.same(map.size, 4);
  map.delete(object);
  assert.same(map.size, 3);
  const frozen = freeze({});
  map.set(frozen, 42);
  assert.same(map.size, 4);
  map.delete(frozen);
  assert.same(map.size, 3);
});

QUnit.test('Map#forEach', assert => {
  assert.isFunction(Map.prototype.forEach);
  assert.arity(Map.prototype.forEach, 1);
  assert.name(Map.prototype.forEach, 'forEach');
  assert.looksNative(Map.prototype.forEach);
  assert.nonEnumerable(Map.prototype, 'forEach');
  let result = {};
  let count = 0;
  const object = {};
  let map = new Map();
  map.set(NaN, 1);
  map.set(2, 1);
  map.set(3, 7);
  map.set(2, 5);
  map.set(1, 4);
  map.set(object, 9);
  map.forEach((value, key) => {
    count++;
    result[value] = key;
  });
  assert.same(count, 5);
  assert.deepEqual(result, {
    1: NaN,
    7: 3,
    5: 2,
    4: 1,
    9: object,
  });
  map = new Map();
  map.set('0', 9);
  map.set('1', 9);
  map.set('2', 9);
  map.set('3', 9);
  result = '';
  map.forEach((value, key) => {
    result += key;
    if (key === '2') {
      map.delete('2');
      map.delete('3');
      map.delete('1');
      map.set('4', 9);
    }
  });
  assert.same(result, '0124');
  map = new Map([['0', 1]]);
  result = '';
  map.forEach(it => {
    map.delete('0');
    if (result !== '') throw new Error();
    result += it;
  });
  assert.same(result, '1');
  assert.throws(() => {
    Map.prototype.forEach.call(new Set(), () => { /* empty */ });
  }, 'non-generic');
});

QUnit.test('Map#get', assert => {
  assert.isFunction(Map.prototype.get);
  assert.name(Map.prototype.get, 'get');
  assert.arity(Map.prototype.get, 1);
  assert.looksNative(Map.prototype.get);
  assert.nonEnumerable(Map.prototype, 'get');
  const object = {};
  const frozen = freeze({});
  const map = new Map();
  map.set(NaN, 1);
  map.set(2, 1);
  map.set(3, 1);
  map.set(2, 5);
  map.set(1, 4);
  map.set(frozen, 42);
  map.set(object, object);
  assert.same(map.get(NaN), 1);
  assert.same(map.get(4), undefined);
  assert.same(map.get({}), undefined);
  assert.same(map.get(object), object);
  assert.same(map.get(frozen), 42);
  assert.same(map.get(2), 5);
});

QUnit.test('Map#has', assert => {
  assert.isFunction(Map.prototype.has);
  assert.name(Map.prototype.has, 'has');
  assert.arity(Map.prototype.has, 1);
  assert.looksNative(Map.prototype.has);
  assert.nonEnumerable(Map.prototype, 'has');
  const object = {};
  const frozen = freeze({});
  const map = new Map();
  map.set(NaN, 1);
  map.set(2, 1);
  map.set(3, 1);
  map.set(2, 5);
  map.set(1, 4);
  map.set(frozen, 42);
  map.set(object, object);
  assert.true(map.has(NaN));
  assert.true(map.has(object));
  assert.true(map.has(2));
  assert.true(map.has(frozen));
  assert.false(map.has(4));
  assert.false(map.has({}));
});

QUnit.test('Map#set', assert => {
  assert.isFunction(Map.prototype.set);
  assert.name(Map.prototype.set, 'set');
  assert.arity(Map.prototype.set, 2);
  assert.looksNative(Map.prototype.set);
  assert.nonEnumerable(Map.prototype, 'set');
  const object = {};
  let map = new Map();
  map.set(NaN, 1);
  map.set(2, 1);
  map.set(3, 1);
  map.set(2, 5);
  map.set(1, 4);
  map.set(object, object);
  assert.same(map.size, 5);
  const chain = map.set(7, 2);
  assert.same(chain, map);
  map.set(7, 2);
  assert.same(map.size, 6);
  assert.same(map.get(7), 2);
  assert.same(map.get(NaN), 1);
  map.set(NaN, 42);
  assert.same(map.size, 6);
  assert.same(map.get(NaN), 42);
  map.set({}, 11);
  assert.same(map.size, 7);
  assert.same(map.get(object), object);
  map.set(object, 27);
  assert.same(map.size, 7);
  assert.same(map.get(object), 27);
  map = new Map();
  map.set(NaN, 2);
  map.set(NaN, 3);
  map.set(NaN, 4);
  assert.same(map.size, 1);
  const frozen = freeze({});
  map = new Map().set(frozen, 42);
  assert.same(map.get(frozen), 42);
});

QUnit.test('Map#size', assert => {
  assert.nonEnumerable(Map.prototype, 'size');
  const map = new Map();
  map.set(2, 1);
  const { size } = map;
  assert.same(typeof size, 'number', 'size is number');
  assert.same(size, 1, 'size is correct');
  if (DESCRIPTORS) {
    const sizeDescriptor = getOwnPropertyDescriptor(Map.prototype, 'size');
    const getter = sizeDescriptor && sizeDescriptor.get;
    const setter = sizeDescriptor && sizeDescriptor.set;
    assert.same(typeof getter, 'function', 'size is getter');
    assert.same(typeof setter, 'undefined', 'size is not setter');
    assert.throws(() => Map.prototype.size, TypeError);
  }
});

QUnit.test('Map & -0', assert => {
  let map = new Map();
  map.set(-0, 1);
  assert.same(map.size, 1);
  assert.true(map.has(0));
  assert.true(map.has(-0));
  assert.same(map.get(0), 1);
  assert.same(map.get(-0), 1);
  map.forEach((val, key) => {
    assert.false(is(key, -0));
  });
  map.delete(-0);
  assert.same(map.size, 0);
  map = new Map([[-0, 1]]);
  map.forEach((val, key) => {
    assert.false(is(key, -0));
  });
  map = new Map();
  map.set(4, 4);
  map.set(3, 3);
  map.set(2, 2);
  map.set(1, 1);
  map.set(0, 0);
  assert.true(map.has(-0));
});

QUnit.test('Map#@@toStringTag', assert => {
  assert.same(Map.prototype[Symbol.toStringTag], 'Map', 'Map::@@toStringTag is `Map`');
  assert.same(String(new Map()), '[object Map]', 'correct stringification');
});

QUnit.test('Map Iterator', assert => {
  const map = new Map();
  map.set('a', 1);
  map.set('b', 2);
  map.set('c', 3);
  map.set('d', 4);
  const results = [];
  const iterator = map.keys();
  assert.isIterator(iterator);
  assert.isIterable(iterator);
  assert.nonEnumerable(iterator, 'next');
  assert.nonEnumerable(iterator, Symbol.iterator);
  results.push(iterator.next().value);
  assert.true(map.delete('a'));
  assert.true(map.delete('b'));
  assert.true(map.delete('c'));
  map.set('e');
  results.push(iterator.next().value, iterator.next().value);
  assert.true(iterator.next().done);
  map.set('f');
  assert.true(iterator.next().done);
  assert.deepEqual(results, ['a', 'd', 'e']);
});

QUnit.test('Map#keys', assert => {
  assert.isFunction(Map.prototype.keys);
  assert.name(Map.prototype.keys, 'keys');
  assert.arity(Map.prototype.keys, 0);
  assert.looksNative(Map.prototype.keys);
  assert.nonEnumerable(Map.prototype, 'keys');
  const map = new Map();
  map.set('a', 'q');
  map.set('s', 'w');
  map.set('d', 'e');
  const iterator = map.keys();
  assert.isIterator(iterator);
  assert.isIterable(iterator);
  assert.same(iterator[Symbol.toStringTag], 'Map Iterator');
  assert.deepEqual(iterator.next(), {
    value: 'a',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: 's',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: 'd',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: undefined,
    done: true,
  });
});

QUnit.test('Map#values', assert => {
  assert.isFunction(Map.prototype.values);
  assert.name(Map.prototype.values, 'values');
  assert.arity(Map.prototype.values, 0);
  assert.looksNative(Map.prototype.values);
  assert.nonEnumerable(Map.prototype, 'values');
  const map = new Map();
  map.set('a', 'q');
  map.set('s', 'w');
  map.set('d', 'e');
  const iterator = map.values();
  assert.isIterator(iterator);
  assert.isIterable(iterator);
  assert.same(iterator[Symbol.toStringTag], 'Map Iterator');
  assert.deepEqual(iterator.next(), {
    value: 'q',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: 'w',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: 'e',
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: undefined,
    done: true,
  });
});

QUnit.test('Map#entries', assert => {
  assert.isFunction(Map.prototype.entries);
  assert.name(Map.prototype.entries, 'entries');
  assert.arity(Map.prototype.entries, 0);
  assert.looksNative(Map.prototype.entries);
  assert.nonEnumerable(Map.prototype, 'entries');
  const map = new Map();
  map.set('a', 'q');
  map.set('s', 'w');
  map.set('d', 'e');
  const iterator = map.entries();
  assert.isIterator(iterator);
  assert.isIterable(iterator);
  assert.same(iterator[Symbol.toStringTag], 'Map Iterator');
  assert.deepEqual(iterator.next(), {
    value: ['a', 'q'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: ['s', 'w'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: ['d', 'e'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: undefined,
    done: true,
  });
});

QUnit.test('Map#@@iterator', assert => {
  assert.isIterable(Map.prototype);
  assert.name(Map.prototype.entries, 'entries');
  assert.arity(Map.prototype.entries, 0);
  assert.looksNative(Map.prototype[Symbol.iterator]);
  assert.same(Map.prototype[Symbol.iterator], Map.prototype.entries);
  const map = new Map();
  map.set('a', 'q');
  map.set('s', 'w');
  map.set('d', 'e');
  const iterator = map[Symbol.iterator]();
  assert.isIterator(iterator);
  assert.isIterable(iterator);
  assert.same(iterator[Symbol.toStringTag], 'Map Iterator');
  assert.same(String(iterator), '[object Map Iterator]');
  assert.deepEqual(iterator.next(), {
    value: ['a', 'q'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: ['s', 'w'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: ['d', 'e'],
    done: false,
  });
  assert.deepEqual(iterator.next(), {
    value: undefined,
    done: true,
  });
});
