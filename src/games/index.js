import BlowCandlesGame from './BlowCandlesGame.jsx'
import TieRakhiGame from './TieRakhiGame.jsx'
import BloomFlowerGame from './BloomFlowerGame.jsx'
import UnwrapGiftGame from './UnwrapGiftGame.jsx'
import OpenSweetsBoxGame from './OpenSweetsBoxGame.jsx'
import CatchStarsGame from './CatchStarsGame.jsx'

export const GAMES = {
  candles: BlowCandlesGame,
  rakhi: TieRakhiGame,
  bloom: BloomFlowerGame,
  giftbox: UnwrapGiftGame,
  sweetsBox: OpenSweetsBoxGame,
  stars: CatchStarsGame,
}

export function getGame(id) {
  return GAMES[id] || null
}
