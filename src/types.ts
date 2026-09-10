export type BookId = 'mercy' | 'faith' | 'livesuit'
export type Confidence = 'low' | 'medium' | 'high'
export type ConnectionStatus = 'confirmed' | 'unconfirmed' | 'interpretive' | 'inferred_not_confirmed'

export interface Association {
  target: string
  type: string
  books: BookId[]
  note?: string
  confidence?: Confidence
  status?: ConnectionStatus
}

export interface Character {
  aliases: string[]
  sex: 'male' | 'female' | 'unknown'
  sex_note?: string
  gender_presentation?: string
  species: string
  books: BookId[]
  groups: string[]
  summary: string
  associations: Association[]
  events: string[]
}

export interface Group { name: string; kind: string }
export interface Event { name: string; book: BookId; summary: string }
export interface Concept { name: string; status: string; summary: string; related_characters: string[] }

export interface ContinuityLink {
  from: string
  to: string
  type: string
  confidence: Confidence
  status: ConnectionStatus
  evidence: string[]
  counterevidence?: string[]
}

export interface Dataset {
  metadata: {
    title: string
    schema_version: string
    updated: string
    books: Record<BookId, string>
    spoilers: string
  }
  characters: Record<string, Character>
  groups: Record<string, Group>
  events: Record<string, Event>
  concepts: Record<string, Concept>
  continuity_links: ContinuityLink[]
}

export interface ResolvedAssociation extends Association {
  direction: 'outgoing' | 'incoming'
  name: string
}

export interface LookupResult extends Character {
  name: string
  associationsResolved: ResolvedAssociation[]
  groupsResolved: Array<Group & { id: string }>
  eventsResolved: Array<Event & { id: string }>
  conceptsResolved: Array<Concept & { id: string }>
  continuityResolved: Array<ContinuityLink & { associatedCharacter: string }>
}
