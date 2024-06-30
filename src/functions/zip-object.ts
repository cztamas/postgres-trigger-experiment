import lodashZipObject = require('lodash/zipObject');

export function zipObject(array1: unknown[], array2: unknown[]) {
  return lodashZipObject(array1, array2);
}
