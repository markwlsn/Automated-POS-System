import { test, describe } from 'node:test'
import assert from 'node:assert/strict'

describe('Weight Keypad Digit Input & Formatting Logic', () => {
  function appendKeypadInput(currentStr, key) {
    if (key === 'CLEAR') return '0'
    if (key === 'BACKSPACE') {
      if (currentStr.length <= 1) return '0'
      return currentStr.slice(0, -1)
    }
    if (key === '.') {
      if (currentStr.includes('.')) return currentStr // disallow double decimal
      return currentStr + '.'
    }
    // Number key
    if (currentStr === '0') return key
    // Max 3 decimal places
    const parts = currentStr.split('.')
    if (parts[1] && parts[1].length >= 3) return currentStr
    return currentStr + key
  }

  test('appends numbers and handles leading zeros correctly', () => {
    let input = '0'
    input = appendKeypadInput(input, '1')
    assert.equal(input, '1')
    input = appendKeypadInput(input, '5')
    assert.equal(input, '15')
  })

  test('handles decimal point without allowing multiple decimals', () => {
    let input = '1'
    input = appendKeypadInput(input, '.')
    assert.equal(input, '1.')
    input = appendKeypadInput(input, '5')
    assert.equal(input, '1.5')
    input = appendKeypadInput(input, '.') // should be ignored
    assert.equal(input, '1.5')
  })

  test('limits decimal precision to maximum 3 digits', () => {
    let input = '1.234'
    input = appendKeypadInput(input, '5')
    assert.equal(input, '1.234', 'Should not append beyond 3 decimal places')
  })

  test('backspace deletes last character or resets to 0', () => {
    assert.equal(appendKeypadInput('1.5', 'BACKSPACE'), '1.')
    assert.equal(appendKeypadInput('1.', 'BACKSPACE'), '1')
    assert.equal(appendKeypadInput('1', 'BACKSPACE'), '0')
    assert.equal(appendKeypadInput('0', 'BACKSPACE'), '0')
  })
})
