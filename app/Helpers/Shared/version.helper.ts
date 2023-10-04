export function isVersionGreater(currentVersion: string, newVersion: string) {
  const currentNumbers = currentVersion.split('.').map(Number)
  const newNumbers = newVersion.split('.').map(Number)

  return newNumbers > currentNumbers
}

export function isVersionValid(version: string) {
  const numbers = version.split('.')
  return numbers.length <= 3 && numbers.map(Number).every((number) => !isNaN(number) && number >= 0)
}

export function beautifyVersion(version: string) {
  const numbers = version.split('.').map(Number)
  while (numbers.length < 3) {
    numbers.push(0)
  }
  return numbers.join('.')
}
