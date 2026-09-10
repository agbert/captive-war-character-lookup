import { describe, expect, it } from 'vitest'
import rawDataset from './data/captive-war-characters.json'
import { createCharacterRepository, validateDataset } from './repository'
import type { Dataset } from './types'

const dataset = rawDataset as Dataset
const repository = createCharacterRepository(dataset)

describe('character repository', () => {
  it('resolves canonical names and aliases case-insensitively', () => {
    expect(repository.resolveCharacterName('Dafyd Alkhor')).toBe('Dafyd Alkhor')
    expect(repository.resolveCharacterName('clae')).toBe('The Swarm / Clae Audin')
  })

  it('returns null for unknown characters', () => {
    expect(repository.getCharacter('Not A Character')).toBeNull()
  })

  it('discovers incoming and outgoing relationships', () => {
    const dafyd = repository.getCharacter('Dafyd')!
    expect(dafyd.associationsResolved.some((edge) => edge.direction === 'outgoing' && edge.name === 'Tonner Freis')).toBe(true)
    expect(dafyd.associationsResolved.some((edge) => edge.direction === 'incoming' && edge.name === 'Urrys Ostencour')).toBe(true)
  })

  it('keeps Corval and Corvall separate', () => {
    expect(repository.resolveCharacterName('Estebán Corval')).toBe('Estebán Corval')
    expect(repository.resolveCharacterName('Corvall')).toBe('Corvall')
    expect(repository.getCharacter('Corvall')!.continuityResolved[0].associatedCharacter).toBe('Estebán Corval')
  })

  it('preserves unknown sex and gender presentation', () => {
    const swarm = repository.getCharacter('Clae')!
    expect(swarm.sex).toBe('unknown')
    expect(swarm.gender_presentation).toBe('female as Clae Audin')
  })

  it('validates references in the source dataset', () => {
    expect(validateDataset(dataset)).toEqual([])
  })
})
