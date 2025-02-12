export const generateUUID = (): string => 'uuid'

export function getRandomEnumValue<T>(enumObj: T): T[keyof T] {
  // @ts-ignore
  const values = Object.values(enumObj) as T[keyof T][] // Get all values of the enum
  const randomIndex = Math.floor(Math.random() * values.length) // Generate a random index
  return values[randomIndex] // Return the random value
}
