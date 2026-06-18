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

const styles = {
  app: { minHeight: "100vh", backgroundColor: "#030712", color: "white", padding: "16px", fontFamily: "sans-serif" },
  container: { maxWidth: "640px", margin: "0 auto" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" },
  title: { fontSize: "20px", fontWeight: "bold", margin: 0 },
  subtitle: { fontSize: "12px", color: "#6b7280", margin: "4px 0 0 0" },
  roundInfo: { textAlign: "right" },
  roundText: { fontSize: "12px", color: "#9ca3af" },
  scoreText: { fontSize: "18px", fontWeight: "bold" },
  sectionLabel: { fontSize: "14px", fontWeight: "bold", marginBottom: "8px" },
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" },
  card: (selected, type) => ({
    cursor: "pointer",
    borderRadius: "12px",
    border: `2px solid ${selected ? typeColor(type).border : typeColor(type).borderDim}`,
    padding: "12px",
    backgroundColor: selected ? typeColor(type).bgSelected : typeColor(type).bg,
    transform: selected ? "scale(1.05)" : "scale(1)",
    transition: "all 0.2s",
    textAlign: "center",
  }),
  cardEmoji: { fontSize: "28px", marginBottom: "4px" },
  cardName: { fontSize: "13px", fontWeight: "bold", marginBottom: "4px" },
  cardDesc: { fontSize: "11px", color: "#9ca3af", lineHeight: "1.4" },
  button: (active) => ({
    width: "100%", padding: "16px", borderRadius: "12px", border: "none",
    fontWeight: "bold", fontSize: "16px", cursor: active ? "pointer" : "not-allowed",
    backgroundColor: active ? "#7c3aed" : "#1f2937", color: active ? "white" : "#4b5563",
    transition: "background-color 0.2s", marginTop: "8px",
  }),
  box: { backgroundColor: "#1f2937", borderRadius: "16px", padding: "20px", marginBottom: "16px" },
  storyText: { fontSize: "14px", lineHeight: "1.8", color: "white" },
  scoreNum: { fontSize: "48px", fontWeight: "bold" },
  scoreSub: { fontSize: "14px", color: "#9ca3af", marginLeft: "4px" },
  barBg: { width: "100%", backgroundColor: "#374151", borderRadius: "9999px", height: "12px", overflow: "hidden", margin: "8px 0 16px" },
  barFill: (score) => ({
    height: "12px", borderRadius: "9999px",
    width: `${score}%`, transition: "width 1s",
    backgroundColor: score >= 80 ? "#34d399" : score >= 60 ? "#fbbf24" : "#f87171",
  }),
  commentBox: { backgroundColor: "#374151", borderRadius: "8px", padding: "12px", marginBottom: "8px" },
  highlightBox: { backgroundColor: "rgba(109,40,217,0.2)", border: "1px solid rgba(109,40,217,0.4)", borderRadius: "8px", padding: "12px" },
  label: (color) => ({ fontSize: "11px", color, marginBottom: "4px" }),
  emojiRow: { display: "flex", gap: "8px", justifyContent: "center", fontSize: "24px", marginBottom: "16px" },
  sep: { color: "#4b5563" },
  center: { textAlign: "center", padding: "64px 0" },
  pulse: { fontSize: "36px", animation: "pulse 1s infinite" },
  nextBtn: { width: "100%", padding: "16px", borderRadius: "12px", border: "none", fontWeight: "bold", fontSize: "16px", cursor: "pointer", backgroundColor: "#7c3aed", color: "white", marginTop: "8px" },
  historyRow: { display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "rgba(31,41,55,0.6)", borderRadius: "8px", padding: "8px 16px", marginBottom: "4px" },
};

function typeColor(type) {
  if (type === "character") return { border: "#a78bfa", borderDim: "rgba(109,40,217,0.4)", bg: "rgba(46,16,101,0.4)", bgSelected: "rgba(91,33,182,0.6)" };
  if (type === "setting") return { border: "#67e8f9", borderDim: "rgba(8,145,178,0.4)", bg: "rgba(8,47,73,0.4)", bgSelected: "rgba(14,116,144,0.6)" };
  return { border: "#fcd34d", borderDim: "rgba(180,83,9,0.4)", bg: "rgba(69,26,3,0.4)", bgSelected: "rgba(146,64,14,0.6)" };
}

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function drawHand(deck) { return shuffle(deck).slice(0, HAND_SIZE); }

async function generateStory(character, setting, event) {
  const prompt = `あなたはショートショート作家です。以下の3つの要素を使って、200文字程度の短い物語を日本語で作ってください。必ず意外なオチや展開を入れてください。

キャラクター: ${character.name}（${character.desc}）
舞台: ${setting.name}（${setting.desc}）
事件: ${event.name}（${event.desc}）

物語だけを返してください。タイトルは不要です。`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  return data.content[0].text;
}

async function rateStory(story) {
  const prompt = `以下のショートショートを100点満点で採点してください。
評価基準: 意外性・オチ(40点)、要素の組み合わせ(30点)、余韻(30点)

物語: ${story}

必ずJSON形式のみで返してください: {"score": 85, "comment": "コメント", "highlight": "最も良かった点"}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 300, messages: [{ role: "user", content: prompt }] }),
  });
  const data = await response.json();
  const text = data.content[0].text.replace(/```json|```/g, "").trim();
  return JSON.parse(text);
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
      setStory(s); setPhase("story");
    } catch { setStory("ストーリーの生成に失敗しました。"); setPhase("story"); }
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
    if (round >= MAX_ROUNDS) { setPhase("gameover"); return; }
    setRound(r => r + 1);
    setHands({ character: drawHand(CARDS.character), setting: drawHand(CARDS.setting), event: drawHand(CARDS.event) });
    setSelected({ character: null, setting: null, event: null });
    setStory(""); setRating(null); setPhase("select");
  };

  const restart = () => {
    setHands({ character: drawHand(CARDS.character), setting: drawHand(CARDS.setting), event: drawHand(CARDS.event) });
    setSelected({ character: null, setting: null, event: null });
    setStory(""); setRating(null); setTotalScore(0); setRound(1); setHistory([]); setPhase("select");
  };

  const avgScore = history.length > 0 ? Math.round(totalScore / history.length) : 0;

  if (phase === "gameover") {
    const rank = avgScore >= 85 ? { label: "伝説の語り部", emoji: "🏆" }
      : avgScore >= 70 ? { label: "熟練の物語師", emoji: "🥈" }
      : { label: "見習いの吟遊詩人", emoji: "🥉" };
    return (
      <div style={styles.app}>
        <div style={{ ...styles.container, textAlign: "center" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>{rank.emoji}</div>
          <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "8px" }}>ゲーム終了！</h1>
          <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "24px", color: "#fbbf24" }}>{rank.label}</div>
          <div style={styles.box}>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "4px" }}>平均スコア</div>
            <div><span style={styles.scoreNum}>{avgScore}</span><span style={styles.scoreSub}>点</span></div>
            <div style={styles.barBg}><div style={styles.barFill(avgScore)} /></div>
          </div>
          {history.map((h, i) => (
            <div key={i} style={styles.historyRow}>
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>Round {i + 1}: {h.character.emoji}{h.setting.emoji}{h.event.emoji}</span>
              <span style={{ fontWeight: "bold" }}>{h.score}点</span>
            </div>
          ))}
          <button onClick={restart} style={{ ...styles.nextBtn, marginTop: "16px" }}>もう一度プレイ</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.app}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <p style={styles.title}>✨ AIストーリーデュエル</p>
            <p style={styles.subtitle}>カードを選んでAIに物語を作らせよう</p>
          </div>
          <div style={styles.roundInfo}>
            <div style={styles.roundText}>Round {round}/{MAX_ROUNDS}</div>
            <div style={styles.scoreText}>{totalScore}点</div>
          </div>
        </div>

        {(phase === "select" || phase === "generating") && (
          <>
            {[
              { type: "character", label: "🧙 キャラクター", color: "#c4b5fd" },
              { type: "setting", label: "🌍 舞台", color: "#67e8f9" },
              { type: "event", label: "⚡ 事件", color: "#fcd34d" },
            ].map(({ type, label, color }) => (
              <div key={type}>
                <div style={{ ...styles.sectionLabel, color }}>{label}</div>
                <div style={styles.grid}>
                  {hands[type].map(card => (
                    <div key={card.id} style={styles.card(selected[type]?.id === card.id, type)} onClick={() => selectCard(type, card)}>
                      <div style={styles.cardEmoji}>{card.emoji}</div>
                      <div style={styles.cardName}>{card.name}</div>
                      <div style={styles.cardDesc}>{card.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={playCards} disabled={!allSelected || phase === "generating"} style={styles.button(allSelected && phase === "select")}>
              {phase === "generating" ? "✨ 物語を生成中..." : allSelected ? "🎴 カードを出す！" : "3枚選んでください"}
            </button>
          </>
        )}

        {phase === "story" && (
          <>
            <div style={styles.emojiRow}>
              <span>{selected.character.emoji}</span><span style={styles.sep}>×</span>
              <span>{selected.setting.emoji}</span><span style={styles.sep}>×</span>
              <span>{selected.event.emoji}</span>
            </div>
            <div style={styles.box}>
              <div style={{ ...styles.label("#9ca3af"), marginBottom: "8px" }}>AIが生成した物語</div>
              <p style={styles.storyText}>{story}</p>
            </div>
            <button onClick={judgeStory} style={{ ...styles.button(true), backgroundColor: "#f59e0b", color: "black" }}>⚖️ 採点してもらう！</button>
          </>
        )}

        {phase === "rating" && (
          <div style={styles.center}>
            <div style={{ fontSize: "36px", marginBottom: "16px" }}>⚖️</div>
            <p style={{ color: "#9ca3af" }}>AIが採点中...</p>
          </div>
        )}

        {phase === "result" && rating && (
          <>
            <div style={styles.emojiRow}>
              <span>{selected.character.emoji}</span><span style={styles.sep}>×</span>
              <span>{selected.setting.emoji}</span><span style={styles.sep}>×</span>
              <span>{selected.event.emoji}</span>
            </div>
            <div style={styles.box}><p style={{ ...styles.storyText, color: "#d1d5db" }}>{story}</p></div>
            <div style={styles.box}>
              <div><span style={styles.scoreNum}>{rating.score}</span><span style={styles.scoreSub}>/ 100点</span></div>
              <div style={styles.barBg}><div style={styles.barFill(rating.score)} /></div>
              <div style={styles.commentBox}>
                <div style={styles.label("#9ca3af")}>💬 AIの評価</div>
                <p style={{ fontSize: "14px", margin: 0 }}>{rating.comment}</p>
              </div>
              <div style={styles.highlightBox}>
                <div style={styles.label("#a78bfa")}>⭐ 最も良かった点</div>
                <p style={{ fontSize: "14px", margin: 0, color: "#ddd6fe" }}>{rating.highlight}</p>
              </div>
            </div>
            <button onClick={nextRound} style={styles.nextBtn}>
              {round >= MAX_ROUNDS ? "🏆 結果を見る" : `➡️ 次のラウンドへ (${round + 1}/${MAX_ROUNDS})`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
