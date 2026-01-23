import { GeometryType, ItemDefinitions } from '../config/items.config'

export class SpawnDeck {
  private deck: GeometryType[] = []
  private discard: GeometryType[] = []

  constructor() {
    this.buildDeck()
    this.shuffle()
  }

  private buildDeck(): void {
    this.deck = []
    for (const definition of Object.values(ItemDefinitions)) {
      for (let i = 0; i < definition.cardCount; i++) {
        this.deck.push(definition.geometryType)
      }
    }
  }

  private shuffle(): void {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
    }
  }

  draw(): GeometryType {
    if (this.deck.length === 0) {
      this.deck = this.discard
      this.discard = []
      this.shuffle()
    }
    if (this.deck.length === 0) {
      return GeometryType.NONE
    }
    const card = this.deck.pop()!
    this.discard.push(card)
    return card
  }

  reset(): void {
    this.discard = []
    this.buildDeck()
    this.shuffle()
  }
}
