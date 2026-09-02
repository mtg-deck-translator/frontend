import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

// Vue compile `@click="foo"` en `foo && foo(...)`. Si le handler n'existe pas,
// le clic est absorbé sans erreur, sans avertissement, sans trace en console :
// le bouton a l'air actif et ne fait rien.
//
// C'est exactement ce qui est arrivé à exportDownload, exportPrint et
// exportBuyCardmarket — supprimés par accident, donc « Exporter .txt »,
// « Imprimer » et « Manquantes » sont restés muets, et le panneau Cardmarket
// est devenu inatteignable. Le parcours s'arrêtait avant sa dernière étape.

const FILES = [
  'src/App.vue',
  ...readdirSync('src/components').map(f => join('src/components', f)),
]

function handlersOf(source) {
  const script = source.slice(source.indexOf('<script'))
  const declared = new Set()

  for (const m of script.matchAll(/(?:^|\n)\s*(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g)) declared.add(m[1])
  for (const m of script.matchAll(/(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/g)) declared.add(m[1])
  // destructurations : const { a, b: c } = useX()
  for (const m of script.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of m[1].split(',')) {
      const name = part.split(':').pop().split('=')[0].trim()
      if (name) declared.add(name)
    }
  }
  for (const m of script.matchAll(/defineEmits\(\s*\[([^\]]*)\]/g)) declared.add('$emit')
  return declared
}

describe('handlers de template', () => {
  it.each(FILES)('%s : chaque @click nomme une fonction qui existe', file => {
    const src = readFileSync(file, 'utf8')
    const template = src.slice(0, src.indexOf('<script'))
    const declared = handlersOf(src)

    // On ne teste que la forme `@click="nomSimple"` — les expressions
    // (`@click="a = b"`, `$emit(...)`, appels avec arguments) sont validées
    // par le compilateur puisqu'elles sont évaluées, pas déréférencées.
    const referenced = [...template.matchAll(/@(?:click|change|input|submit)="([A-Za-z][A-Za-z0-9_$]*)"/g)]
      .map(m => m[1])

    const missing = [...new Set(referenced)].filter(name => !declared.has(name))
    expect(missing, `handlers référencés mais non définis : ${missing.join(', ')}`).toEqual([])
  })
})
