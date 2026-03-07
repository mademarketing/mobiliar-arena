type TranslationDict = Record<string, string>;

const de: TranslationDict = {
  "lobby.instruction": "Drücke beide Tasten,\num dich anzumelden",
  "lobby.waitingPlayers": "Warte auf Spieler...",
  "lobby.needMore": "{n} Spieler – noch {need} mehr",
  "lobby.playersReady": "{n} Spieler bereit!",
  "lobby.pressEnter": "Drücke ENTER zum Starten",
  "countdown.intro1": "Ihr steuert das Paddle\nmit den Tasten\nnach links und rechts.",
  "countdown.intro2": "Ihr spielt zusammen.\nHaltet die Bälle im Spiel.",
  "countdown.go": "GO!",
  "infoPanel.highScoreLabel": "Aktueller Highscore:",
  "infoPanel.score": "{score} Punkte",
  "result.maxBalls": "Max. Bälle: {n}",
  "result.longestRally": "Längster Rally: {n}",
  "result.onFire": "On Fire: {n}",
  "result.newHighScore": "NEW HIGH SCORE!",
  "game.onFire": "ON FIRE!",
  "game.combo": "COMBO x{n}!",
  "game.difficultyUp": "SCHWIERIGER!",
  "game.comboHud": "{n}x COMBO!",
};

const fr: TranslationDict = {
  "lobby.instruction": "Appuie sur les\ndeux boutons\npour t'inscrire",
  "lobby.waitingPlayers": "En attente de joueurs...",
  "lobby.needMore": "{n} joueurs – encore {need}",
  "lobby.playersReady": "{n} joueurs prêts!",
  "lobby.pressEnter": "Appuie sur ENTER pour démarrer",
  "countdown.intro1": "Contrôlez la raquette\navec les boutons\ngauche et droite.",
  "countdown.intro2": "Vous jouez ensemble.\nGardez les balles en jeu.",
  "countdown.go": "GO!",
  "infoPanel.highScoreLabel": "Meilleur score actuel:",
  "infoPanel.score": "{score} points",
  "result.maxBalls": "Max. balles: {n}",
  "result.longestRally": "Plus long échange: {n}",
  "result.onFire": "On Fire: {n}",
  "result.newHighScore": "NOUVEAU RECORD!",
  "game.onFire": "ON FIRE!",
  "game.combo": "COMBO x{n}!",
  "game.difficultyUp": "PLUS DIFFICILE!",
  "game.comboHud": "{n}x COMBO!",
};

const dictionaries: Record<string, TranslationDict> = { de, fr };

let activeDict: TranslationDict = de;

export function initTranslations(lang: string): void {
  activeDict = dictionaries[lang] ?? de;
}

export function t(key: string, vars?: Record<string, string | number>): string {
  let text = activeDict[key] ?? de[key] ?? key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}
