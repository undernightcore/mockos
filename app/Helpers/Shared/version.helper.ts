export function isVersionGreater(currentVersion: string, newVersion: string) {
  if (!isVersionValid(currentVersion) || !isVersionValid(newVersion)) return false

  const currentNumbers = currentVersion.split('.').map((number) => Number(number))
  const newNumbers = newVersion.split('.').map((number) => Number(number))

  const isCurrentLonger = currentNumbers.length > newNumbers.length
  const longestNumbers = isCurrentLonger ? currentNumbers : newNumbers
  const shortestNumbers = isCurrentLonger ? newNumbers : currentNumbers

  const differentIndex = longestNumbers.findIndex(
    (number, index) => number !== (shortestNumbers[index] ?? 0)
  )

  if (differentIndex === -1) return false
}

export function isVersionValid(version: string) {
  const numbers = version.split('.')
  return numbers.every((number) => !isNaN(Number(number)))
}
