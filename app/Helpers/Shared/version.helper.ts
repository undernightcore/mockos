export function isVersionGreater(currentVersion: string, newVersion: string) {
  const currentNumbers = currentVersion.split('.').map(Number)
  const newNumbers = newVersion.split('.').map(Number)

  const isCurrentLonger = currentNumbers.length > newNumbers.length
  const longestNumbers = isCurrentLonger ? currentNumbers : newNumbers
  const shortestNumbers = isCurrentLonger ? newNumbers : currentNumbers

  const differentIndex = longestNumbers.findIndex(
    (number, index) => number !== (shortestNumbers[index] ?? 0)
  )

  if (differentIndex === -1) return false

  const isLongestGreater = longestNumbers[differentIndex] > (shortestNumbers[differentIndex] ?? 0)

  return (isLongestGreater && !isCurrentLonger) || (!isLongestGreater && isCurrentLonger)
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
