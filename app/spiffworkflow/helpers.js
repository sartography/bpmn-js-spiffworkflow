// https://stackoverflow.com/a/5767357/6090676
export function removeFirstInstanceOfItemFromArrayInPlace(arr, value) {
  const index = arr.indexOf(value);
  if (index > -1) {
    arr.splice(index, 1);
  }
  return arr;
}
