<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import rawDataset from './data/captive-war-characters.json'
import { createCharacterRepository, validateDataset } from './repository'
import type { Dataset, LookupResult, ResolvedAssociation } from './types'

const dataset = rawDataset as Dataset
const repository = createCharacterRepository(dataset)
const validationErrors = validateDataset(dataset)

const query = ref('')
const result = ref<LookupResult | null>(null)
const searched = ref(false)
const isDark = ref(false)
const input = ref<HTMLInputElement | null>(null)

const suggestions = computed(() => repository.suggestions(query.value))
const featured = ['Dafyd Alkhor', 'The Swarm / Clae Audin', 'Jessyn Kaul', 'Kirin Foss']

function search(value = query.value) {
  query.value = value
  result.value = repository.getCharacter(value)
  searched.value = true
  if (result.value) query.value = result.value.name
  requestAnimationFrame(() => document.querySelector<HTMLElement>('#result')?.focus())
}

function openCharacter(name: string) {
  search(name)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function readable(value: string) {
  const phrase = value.replaceAll('_', ' ')
  return phrase.charAt(0).toUpperCase() + phrase.slice(1)
}

function directionText(edge: ResolvedAssociation) {
  return edge.direction === 'outgoing' ? 'Relationship to' : 'Relationship from'
}

function toggleTheme() {
  isDark.value = !isDark.value
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
  localStorage.setItem('cw-theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  isDark.value = localStorage.getItem('cw-theme') === 'dark'
    || (!localStorage.getItem('cw-theme') && matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light'
})
</script>

<template>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="#" aria-label="Character Archive home" @click.prevent="result = null; searched = false; query = ''">
        <span class="brand-mark" aria-hidden="true">CW</span>
        <span>Character Archive</span>
      </a>
      <button class="theme-toggle" type="button" :aria-label="`Use ${isDark ? 'light' : 'dark'} theme`" @click="toggleTheme">
        <span aria-hidden="true">{{ isDark ? '☀' : '◐' }}</span>
        {{ isDark ? 'Light' : 'Dark' }}
      </button>
    </header>

    <main>
      <section class="hero" :class="{ compact: result || searched }">
        <h1>The Captive’s War</h1>
        <p class="hero-question">Who are you looking for?</p>
        <p class="intro">Search a name or alias to uncover a character’s story, allegiances, and connections.</p>

        <form class="search-form" role="search" @submit.prevent="search()">
          <label class="sr-only" for="character-search">Character name or alias</label>
          <div class="search-field">
            <svg aria-hidden="true" viewBox="0 0 24 24"><path d="m21 21-4.35-4.35m2.35-5.65a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z"/></svg>
            <input
              id="character-search"
              ref="input"
              v-model="query"
              type="search"
              autocomplete="off"
              placeholder="Try “Dafyd” or “Clae”"
              list="character-suggestions"
            />
            <datalist id="character-suggestions">
              <option v-for="name in suggestions" :key="name" :value="name" />
            </datalist>
            <button type="submit" :disabled="!query.trim()">Search archive</button>
          </div>
        </form>

        <div v-if="!result && !searched" class="featured" aria-label="Suggested characters">
          <span>Start with</span>
          <button v-for="name in featured" :key="name" type="button" @click="openCharacter(name)">
            {{ name.replace('The Swarm / ', '') }}
          </button>
        </div>
      </section>

      <div v-if="validationErrors.length" class="error-panel" role="alert">
        <strong>The character data could not be loaded safely.</strong>
        <ul><li v-for="error in validationErrors" :key="error">{{ error }}</li></ul>
      </div>

      <section v-else-if="searched && !result" id="result" class="empty-state" tabindex="-1">
        <span aria-hidden="true">?</span>
        <h2>No character found</h2>
        <p>There’s no canonical name or alias matching “{{ query }}”. Check the spelling or try one of these:</p>
        <div class="empty-actions">
          <button v-for="name in (suggestions.length ? suggestions : featured.slice(0, 3))" :key="name" @click="openCharacter(name)">
            {{ name }}
          </button>
        </div>
      </section>

      <article v-else-if="result" id="result" class="result" tabindex="-1">
        <header class="identity-card">
          <div class="identity-main">
            <div class="monogram" aria-hidden="true">{{ result.name.split(/\s|\//).filter(Boolean).slice(0, 2).map((part) => part[0]).join('') }}</div>
            <div>
              <p class="result-label">Character record</p>
              <h2>{{ result.name }}</h2>
              <p v-if="result.aliases.length" class="aliases">Also known as {{ result.aliases.join(' · ') }}</p>
            </div>
          </div>
          <dl class="facts">
            <div><dt>Sex</dt><dd>{{ readable(result.sex) }}</dd></div>
            <div v-if="result.gender_presentation"><dt>Presentation</dt><dd>{{ readable(result.gender_presentation) }}</dd></div>
            <div><dt>Species</dt><dd>{{ readable(result.species) }}</dd></div>
          </dl>
          <p class="summary">{{ result.summary }}</p>
          <div class="book-row" aria-label="Book appearances">
            <span v-for="book in result.books" :key="book">{{ dataset.metadata.books[book] }}</span>
          </div>
        </header>

        <div class="content-grid">
          <section class="panel relationships">
            <div class="section-heading">
              <div><p class="section-kicker">Network</p><h3>Relationships</h3></div>
              <span>{{ result.associationsResolved.length }} connections</span>
            </div>
            <div v-if="result.associationsResolved.length" class="relationship-list">
              <button
                v-for="(edge, index) in result.associationsResolved"
                :key="`${edge.direction}-${edge.name}-${edge.type}-${index}`"
                class="relationship"
                type="button"
                @click="openCharacter(edge.name)"
              >
                <span class="relation-line" aria-hidden="true"></span>
                <span class="relation-content">
                  <small>{{ directionText(edge) }}</small>
                  <strong>{{ edge.name }}</strong>
                  <span>{{ readable(edge.type) }}</span>
                  <em v-if="edge.note">{{ edge.note }}</em>
                  <span class="tags">
                    <i v-for="book in edge.books" :key="book">{{ dataset.metadata.books[book] }}</i>
                    <i v-if="edge.status" class="speculative">{{ readable(edge.status) }}</i>
                    <i v-if="edge.confidence">{{ readable(edge.confidence) }} confidence</i>
                  </span>
                </span>
                <span class="arrow" aria-hidden="true">→</span>
              </button>
            </div>
            <p v-else class="muted">No direct relationships are recorded for this character.</p>
          </section>

          <aside class="sidebar">
            <section class="panel">
              <p class="section-kicker">Affiliations</p>
              <h3>Groups</h3>
              <ul v-if="result.groupsResolved.length" class="detail-list">
                <li v-for="group in result.groupsResolved" :key="group.id">
                  <strong>{{ group.name }}</strong><span>{{ group.kind }}</span>
                </li>
              </ul>
              <p v-else class="muted">No groups recorded.</p>
            </section>

            <section v-if="result.continuityResolved.length" class="panel continuity">
              <p class="section-kicker">Cross-book</p>
              <h3>Continuity links</h3>
              <button v-for="link in result.continuityResolved" :key="`${link.from}-${link.to}`" @click="openCharacter(link.associatedCharacter)">
                <span><strong>{{ link.associatedCharacter }}</strong><small>{{ readable(link.type) }}</small></span>
                <span class="status">{{ link.status }} · {{ link.confidence }}</span>
              </button>
            </section>
          </aside>
        </div>

        <section v-if="result.eventsResolved.length" class="panel timeline">
          <div class="section-heading">
            <div><p class="section-kicker">Story</p><h3>Connected events</h3></div>
          </div>
          <ol>
            <li v-for="event in result.eventsResolved" :key="event.id">
              <span class="timeline-dot" aria-hidden="true"></span>
              <div><small>{{ dataset.metadata.books[event.book] }}</small><strong>{{ event.name }}</strong><p>{{ event.summary }}</p></div>
            </li>
          </ol>
        </section>

        <section v-if="result.conceptsResolved.length" class="concepts">
          <p class="section-kicker">Ideas & interpretation</p>
          <h3>Related concepts</h3>
          <div class="concept-grid">
            <article v-for="concept in result.conceptsResolved" :key="concept.id">
              <span>{{ readable(concept.status) }}</span>
              <h4>{{ concept.name }}</h4>
              <p>{{ concept.summary }}</p>
            </article>
          </div>
        </section>
      </article>
    </main>

    <footer>
      <span>Contains major spoilers for The Captive’s War.</span>
      <span>{{ repository.names.length }} character records · Dataset {{ dataset.metadata.schema_version }}</span>
    </footer>
  </div>
</template>
