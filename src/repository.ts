import type { Dataset, LookupResult, ResolvedAssociation } from './types'

const normalize = (value: string) => value.trim().toLocaleLowerCase('en-US')

export function createCharacterRepository(dataset: Dataset) {
  const names = Object.keys(dataset.characters)

  function resolveCharacterName(nameOrAlias: string): string | null {
    const wanted = normalize(nameOrAlias)
    if (!wanted) return null

    return names.find((name) =>
      normalize(name) === wanted || dataset.characters[name].aliases.some((alias) => normalize(alias) === wanted),
    ) ?? null
  }

  function suggestions(query: string, limit = 6): string[] {
    const wanted = normalize(query)
    if (!wanted) return []

    return names
      .map((name) => {
        const character = dataset.characters[name]
        const fields = [name, ...character.aliases]
        const exact = fields.some((value) => normalize(value) === wanted)
        const starts = fields.some((value) => normalize(value).startsWith(wanted))
        const contains = fields.some((value) => normalize(value).includes(wanted))
        return { name, score: exact ? 0 : starts ? 1 : contains ? 2 : 3 }
      })
      .filter(({ score }) => score < 3)
      .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name))
      .slice(0, limit)
      .map(({ name }) => name)
  }

  function getCharacter(nameOrAlias: string): LookupResult | null {
    const name = resolveCharacterName(nameOrAlias)
    if (!name) return null
    const character = dataset.characters[name]

    const outgoing: ResolvedAssociation[] = character.associations.map((edge) => ({
      ...edge,
      direction: 'outgoing',
      name: edge.target,
    }))
    const incoming: ResolvedAssociation[] = names.flatMap((source) =>
      dataset.characters[source].associations
        .filter((edge) => edge.target === name)
        .map((edge) => ({ ...edge, direction: 'incoming' as const, name: source })),
    )

    return {
      name,
      ...character,
      associationsResolved: [...outgoing, ...incoming],
      groupsResolved: character.groups.map((id) => ({ id, ...dataset.groups[id] })),
      eventsResolved: character.events.map((id) => ({ id, ...dataset.events[id] })),
      conceptsResolved: Object.entries(dataset.concepts)
        .filter(([, concept]) => concept.related_characters.includes(name))
        .map(([id, concept]) => ({ id, ...concept })),
      continuityResolved: dataset.continuity_links
        .filter((link) => link.from === name || link.to === name)
        .map((link) => ({
          ...link,
          associatedCharacter: link.from === name ? link.to : link.from,
        })),
    }
  }

  return { getCharacter, resolveCharacterName, suggestions, names }
}

export function validateDataset(dataset: Dataset): string[] {
  const errors: string[] = []
  const characters = new Set(Object.keys(dataset.characters))
  const books = new Set(Object.keys(dataset.metadata.books))

  Object.entries(dataset.characters).forEach(([name, character]) => {
    character.associations.forEach((edge) => {
      if (!characters.has(edge.target)) errors.push(`${name} references unknown character “${edge.target}”.`)
      edge.books.forEach((book) => {
        if (!books.has(book)) errors.push(`${name} references unknown book “${book}”.`)
      })
    })
    character.groups.forEach((id) => {
      if (!dataset.groups[id]) errors.push(`${name} references unknown group “${id}”.`)
    })
    character.events.forEach((id) => {
      if (!dataset.events[id]) errors.push(`${name} references unknown event “${id}”.`)
    })
  })

  return errors
}
