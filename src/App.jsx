import { useState, useCallback } from "react";

const CARDS = {
  character: [
    { id: "c1", name: "迷子の魔法使い", emoji: "🧙", desc: "呪文を間違えてばかりの見習い" },
    { id: "c2", name: "老いた海賊", emoji: "🏴‍☠️", desc: "伝説の財宝を探し続けて50年" },
    { id: "c3", name: "眠れない科学者", emoji: "🔬", desc: "不眠不休で実験を続ける天才" },
    { id: "c4", name: "時間泥棒", emoji: "⏰", desc: "他人の時間を盗んで生きる謎の人物" },
    { id: "c5", name: "孤独なロボット", emoji: "🤖", desc: "友達を探して旅するAI" },
    { id: "c6", name: "うそつきの王様", emoji: "👑", desc: "真実を一度も言ったことがない統治者" },
  ],
  setting: [
    { id: "s1", name: "水没した図書館", emoji: "📚", desc: "深海に沈んだ古代の知識の殿堂" },
    { id: "s2", name: "逆さまの村", emoji: "🏘️", desc: "空に浮かんで逆さまに建つ集落" },
    { id: "s3", name: "記憶の市場", emoji: "🛒", desc: "人々の記憶が売買される不思議な場所" },
    { id: "s4", name: "夢の終点駅", emoji: "🚉", desc: "夢の世界と現実の境界にある駅" },
    { id: "s5", name: "星が降る砂漠", emoji: "🌠", desc: "毎晩流れ星が地面に降り積もる場所" },
    { id: "s6", name: "時間の廃墟", emoji: "🏚️", desc: "過去と未来が混在する崩れた城" },
  ],
  event: [
    { id: "e1", name: "突然の停電", emoji: "⚡", desc: "すべての光が消えた瞬間" },
    { id: "e2", name: "見知らぬ手紙", emoji: "📬", desc: "差出人不明の奇妙なメッセージが届く" },
    { id: "e3", name: "空から魚が降る", emoji: "🐟", desc: "原因不明の奇妙な天気現象" },
    { id: "e4", name: "全員が眠り込む", emoji: "😴", desc: "理由なく周囲全員が眠ってしまう" },
    { id: "e5", name: "鏡が喋り出す", emoji: "🪞", desc: "反射の中から声が聞こえてくる" },
    { id: "e6", name: "色が消える", emoji: "🎨", desc: "世界からある一色だけが消えてしまう" },
  ],
};

const HAND_SIZE = 3;

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function drawHand(deck) {
  return shuffle(deck).slice(0, HAND_SIZE);
}

async function generateStory(character, setting, event) {
  const prompt = `あなたはショートショート作家です。以下の3つの要素を使って、200文字程度の短い物語を日本語で作ってください。必ず意外なオチや展開を入れてください。

キャラクター: ${character.name}（${character.desc}）
舞台: ${setting.name}（${setting.desc}）
事件: ${event.name}（${event.desc}）

物語だけを返してください。タイトルは不要です。`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  return data.content[0].text;
}

async function rateStory(story) {
  const prompt = `以下のショートショートを読んで、100点満点で点数をつけてください。
評価基準:
- 意外性・オチの面白さ (40点)
- 3要素の組み合わせの巧みさ (30点)
- 読んだ後の余韻 (30点)

物語:
${story}

必ずJSON形式のみで返してください。例: {"score": 85, "comment": "コメント", "highlight": "最も良かった点"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
}

function CardItem({ card, selected, onClick, type }) {
  const colors = {
    character: selected ? "border-violet-400 bg-violet-900/60 shadow-violet-500/40" : "border-violet-700/40 bg-violet-950/40 hover:border-violet-500",
    setting: selected ? "border-cyan-400 bg-cyan-900/60 shadow-cyan-500/40" : "border-cyan-700/40 bg-cyan-950/40 hover:border-cyan-500",
    event: selected ? "border-amber-400 bg-amber-900/60 shadow-amber-500/40" : "border-amber-700/40 bg-amber-950/40 hover:border-amber-500",
  };
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded-xl border-2 p-3 transition-all duration-200 ${colors[type]} ${selected ? "shadow-lg scale-105" : "hover:scale-102"}`}
    >
      <div className="text-3xl mb-1 text-center">{card.emoji}</div>
      <div className="text-white font-bold text-sm text-center mb-1">{card.name}</div>
      <div className="text-gray-400 text-xs text-center leading-tight">{card.desc}</div>
    </div>
  );
}

function ScoreBar({ score }) {
  const color = score >= 80 ? "bg-emerald-400" : score >= 60 ? "bg-yellow-400" : "bg-red-400";
  return (
    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
      <div
        className={`h-3 rounded-full transition-all duration-1000 ${color}`}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export default function App() {
  const [hands, setHands] = useState({
    character: drawHand(CARDS.character),
    setting: drawHand(CARDS.setting),
    event: drawHand(CARDS.event),
  });
  const [selected, setSelected] = useState({ character: null, setting: null, event: null });
  const [phase, setPhase] = useState("select");
  const [story, setStory] = useState("");
  const [rating, setRating] = useState(null);
  const [totalScore, setTotalScore] = useState(0);
  const [round, setRound] = useState(1);
  const [history, setHistory] = useState([]);

  const MAX_ROUNDS = 3;

  const selectCard = (type, card) => {
    if (phase !== "select") return;
    setSelected(s => ({ ...s, [type]: card }));
  };

  const allSelected = selected.character && selected.setting && selected.event;

  const playCards = useCallback(async () => {
    if (!allSelected) return;
    setPhase("generating");
    try {
      const s = await generateStory(selected.character, selected.setting, selected.event);
      setStory(s);
      setPhase("story");
    } catch {
      setStory("ストーリーの生成に失敗しました。もう一度お試しください。");
      setPhase("story");
    }
  }, [allSelected, selected]);

  const judgeStory = useCallback(async () => {
    setPhase("rating");
    try {
      const r = await rateStory(story);
      setRating(r);
      setTotalScore(prev => prev + r.score);
      setHistory(prev => [...prev, { character: selected.character, setting: selected.setting, event: selected.event, score: r.score }]);
      setPhase("result");
    } catch {
      setRating({ score: 70, comment: "採点に失敗しましたが、良い物語でした！", highlight: "独創的な組み合わせ" });
      setPhase("result");
    }
  }, [story, selected]);

  const nextRound = () => {
    if (round >= MAX_ROUNDS) {
      setPhase("gameover");
      return;
    }
    setRound(r => r + 1);
    setHands({
      character: drawHand(CARDS.character),
      setting: drawHand(CARDS.setting),
      event: drawHand(CARDS.event),
    });
    setSelected({ character: null, setting: null, event: null });
    setStory("");
    setRating(null);
    setPhase("select");
  };

  const restart = () => {
    setHands({
      character: drawHand(CARDS.character),
      setting: drawHand(CARDS.setting),
      event: drawHand(CARDS.event),
    });
    setSelected({ character: null, setting: null, event: null });
    setStory("");
    setRating(null);
    setTotalScore(0);
    setRound(1);
    setHistory([]);
    setPhase("select");
  };

  const avgScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;

  if (phase === "gameover") {
    const rank = avgScore >= 85 ? { label: "伝説の語り部", emoji: "🏆", color: "text-yellow-300" }
      : avgScore >= 70 ? { label: "熟練の物語師", emoji: "🥈", color: "text-gray-300" }
      : { label: "見習いの吟遊詩人", emoji: "🥉", color: "text-orange-400" };
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-4">{rank.emoji}</div>
          <h1 className="text-3xl font-bold text-white mb-2">ゲーム終了！</h1>
          <div className={`text-2xl font-bold mb-6 ${rank.color}`}>{rank.label}</div>
          <div className="bg-gray-800 rounded-2xl p-6 mb-6">
            <div className="text-gray-400 text-sm mb-1">平均スコア</div>
            <div className="text-5xl font-bold text-white mb-3">{avgScore}<span className="text-xl text-gray-400">点</span></div>
            <ScoreBar score={avgScore} />
          </div>
          <div className="space-y-2 mb-6">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-800/60 rounded-lg px-4 py-2">
                <span className="text-gray-400 text-sm">Round {i + 1}: {h.character.emoji}{h.setting.emoji}{h.event.emoji}</span>
                <span className="text-white font-bold">{h.score}点</span>
              </div>
            ))}
          </div>
          <button onClick={restart} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-3 rounded-xl transition-colors">
            もう一度プレイ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4" style={{ fontFamily: "'Hiragino Kaku Gothic ProN', sans-serif" }}>
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-white">✨ AIストーリーデュエル</h1>
            <p className="text-gray-500 text-xs">カードを選んでAIに物語を作らせよう</p>
          </div>
          <div className="text-right">
            <div className="text-gray-400 text-xs">Round {round}/{MAX_ROUNDS}</div>
            <div className="text-white font-bold">{totalScore}点</div>
          </div>
        </div>

        {(phase === "select" || phase === "generating") && (
          <>
            {[
              { type: "character", label: "🧙 キャラクター", color: "text-violet-300" },
              { type: "setting", label: "🌍 舞台", color: "text-cyan-300" },
              { type: "event", label: "⚡ 事件", color: "text-amber-300" },
            ].map(({ type, label, color }) => (
              <div key={type} className="mb-4">
                <div className={`text-sm font-bold mb-2 ${color}`}>{label}</div>
                <div className="grid grid-cols-3 gap-2">
                  {hands[type].map(card => (
                    <CardItem key={card.id} card={card} type={type} selected={selected[type]?.id === card.id} onClick={() => selectCard(type, card)} />
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={playCards}
              disabled={!allSelected || phase === "generating"}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-200 mt-2 ${allSelected && phase === "select" ? "bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/50" : "bg-gray-800 text-gray-600 cursor-not-allowed"}`}
            >
              {phase === "generating" ? "✨ 物語を生成中..." : allSelected ? "🎴 カードを出す！" : "3枚選んでください"}
            </button>
          </>
        )}

        {phase === "story" && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center text-2xl">
              <span>{selected.character.emoji}</span><span className="text-gray-600">×</span>
              <span>{selected.setting.emoji}</span><span className="text-gray-600">×</span>
              <span>{selected.event.emoji}</span>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5">
              <div className="text-gray-400 text-xs mb-3">AIが生成した物語</div>
              <p className="text-white leading-relaxed text-sm">{story}</p>
            </div>
            <button onClick={judgeStory} className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-4 rounded-xl transition-colors">⚖️ 採点してもらう！</button>
          </div>
        )}

        {phase === "rating" && (
          <div className="text-center py-16">
            <div className="text-4xl mb-4 animate-pulse">⚖️</div>
            <p className="text-gray-400">AIが採点中...</p>
          </div>
        )}

        {phase === "result" && rating && (
          <div className="space-y-4">
            <div className="flex gap-2 justify-center text-2xl">
              <span>{selected.character.emoji}</span><span className="text-gray-600">×</span>
              <span>{selected.setting.emoji}</span><span className="text-gray-600">×</span>
              <span>{selected.event.emoji}</span>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5">
              <p className="text-gray-300 text-sm leading-relaxed">{story}</p>
            </div>
            <div className="bg-gray-800 rounded-2xl p-5">
              <div className="flex items-end gap-2 mb-3">
                <span className="text-5xl font-bold text-white">{rating.score}</span>
                <span className="text-gray-400 mb-1">/ 100点</span>
              </div>
              <ScoreBar score={rating.score} />
              <div className="mt-4 space-y-2">
                <div className="bg-gray-700/50 rounded-lg p-3">
                  <div className="text-xs text-gray-400 mb-1">💬 AIの評価</div>
                  <p className="text-sm text-white">{rating.comment}</p>
                </div>
                <div className="bg-violet-900/30 border border-violet-700/40 rounded-lg p-3">
                  <div className="text-xs text-violet-400 mb-1">⭐ 最も良かった点</div>
                  <p className="text-sm text-violet-200">{rating.highlight}</p>
                </div>
              </div>
            </div>
            <button onClick={nextRound} className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold py-4 rounded-xl transition-colors">
              {round >= MAX_ROUNDS ? "🏆 結果を見る" : `➡️ 次のラウンドへ (${round + 1}/${MAX_ROUNDS})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
