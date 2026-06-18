import { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, push } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyB2KXTNjAlnLaYSyt8ZLKuSNg7R5tjt0gQ",
  authDomain: "hatapongame-12db.firebaseapp.com",
  databaseURL: "https://hatapongame-12db-default-rtdb.firebaseio.com",
  projectId: "hatapongame-12db",
  storageBucket: "hatapongame-12db.firebasestorage.app",
  messagingSenderId: "953563879283",
  appId: "1:953563879283:web:276530ccbdbaef1957d706",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const CARDS = [
  { id: "c1", name: "魔法使いの弟子 マナ", emoji: "🧙", atk: 2000, weakness: ["c6"] },
  { id: "c2", name: "老いた海賊 ルヒィ",   emoji: "🏴‍☠️", atk: 1200, weakness: [] },
  { id: "c3", name: "はぐれ研究員 さとる", emoji: "🔬", atk: 600,  weakness: ["c6"] },
  { id: "c4", name: "タイムパトロール トランクス", emoji: "⏰", atk: 1000, weakness: ["c7","c8"] },
  { id: "c5", name: "孤独なロボット セブン", emoji: "🤖", atk: 700,  weakness: ["c7","c8"] },
  { id: "c6", name: "うそつきの王様 ガイア", emoji: "👑", atk: 100,  weakness: ["c4"] },
  { id: "c7", name: "炎の女戦士 ホムラ",   emoji: "⚔️", atk: 3000, weakness: ["c3"] },
  { id: "c8", name: "光の使者 ヒカリ",     emoji: "🧊", atk: 4000, weakness: ["c3"] },
  { id: "c9", name: "風の使者 スバル",     emoji: "💨", atk: 1100, weakness: ["c7"] },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// 勝敗判定
// 天敵に当たったら即負け。両方天敵なら引き分け。それ以外はATK勝負
function calcResult(myCard, oppCard) {
  const myWeakToOpp = myCard.weakness.includes(oppCard.id);
  const oppWeakToMe = oppCard.weakness.includes(myCard.id);
  if (myCard.id === oppCard.id) return { outcome: "draw", msg: "同じカード！両方0点", myScore: 0, oppScore: 0 };
  if (myWeakToOpp && oppWeakToMe) return { outcome: "draw", msg: "相性相殺！引き分け", myScore: 0, oppScore: 0 };
  if (myWeakToOpp) return { outcome: "lose", msg: `${oppCard.name}は${myCard.name}の天敵！`, myScore: 0, oppScore: oppCard.atk };
  if (oppWeakToMe) return { outcome: "win", msg: `${myCard.name}は${oppCard.name}の天敵！`, myScore: myCard.atk, oppScore: 0 };
  if (myCard.atk > oppCard.atk) return { outcome: "win", msg: `ATK勝負！${myCard.name}の勝ち`, myScore: myCard.atk - oppCard.atk, oppScore: 0 };
  if (oppCard.atk > myCard.atk) return { outcome: "lose", msg: `ATK勝負！${oppCard.name}の勝ち`, myScore: 0, oppScore: oppCard.atk - myCard.atk };
  return { outcome: "draw", msg: "ATK同値！引き分け", myScore: 0, oppScore: 0 };
}

const s = {
  app: { minHeight: "100vh", backgroundColor: "#030712", color: "white", padding: "16px", fontFamily: "sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "16px" },
  title: { fontSize: "28px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" },
  sub: { color: "#9ca3af", fontSize: "14px", marginBottom: "32px", textAlign: "center" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #374151", backgroundColor: "#111827", color: "white", fontSize: "16px", marginBottom: "12px", boxSizing: "border-box" },
  btn: (color="#7c3aed") => ({ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: color, color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "8px" }),
  card: (selected) => ({ cursor: "pointer", borderRadius: "12px", border: `2px solid ${selected ? "#a78bfa" : "#374151"}`, padding: "10px 6px", backgroundColor: selected ? "rgba(109,40,217,0.3)" : "#111827", transform: selected ? "scale(1.05)" : "scale(1)", transition: "all 0.2s", textAlign: "center" }),
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" },
  box: { backgroundColor: "#111827", borderRadius: "16px", padding: "16px", marginBottom: "12px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  badge: (color) => ({ backgroundColor: color, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }),
  divider: { display: "flex", alignItems: "center", gap: "8px", margin: "8px 0" },
  line: { flex: 1, height: "1px", backgroundColor: "#374151" },
  weakBadge: { backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "4px", padding: "1px 5px", fontSize: "9px", color: "#fca5a5", marginTop: "2px" },
};

function CardView({ card, selected, onClick }) {
  const weakNames = card.weakness.map(wid => CARDS.find(c => c.id === wid)?.emoji).join(" ");
  return (
    <div style={s.card(selected)} onClick={onClick}>
      <div style={{ fontSize: "28px", marginBottom: "2px" }}>{card.emoji}</div>
      <div style={{ fontSize: "10px", fontWeight: "bold", marginBottom: "2px", lineHeight: "1.3" }}>{card.name}</div>
      <div style={{ backgroundColor: "#dc2626", borderRadius: "4px", padding: "2px 6px", fontSize: "12px", fontWeight: "bold", display: "inline-block", marginBottom: "2px" }}>ATK {card.atk}</div>
      {weakNames && <div style={s.weakBadge}>弱点 {weakNames}</div>}
    </div>
  );
}

function ResultBox({ outcome, msg, myCard, oppCard, myName, oppName, myScore, oppScore, onNext, round, maxRounds }) {
  const color = outcome === "win" ? "#34d399" : outcome === "lose" ? "#f87171" : "#fbbf24";
  const icon = outcome === "win" ? "🎉" : outcome === "lose" ? "💀" : "🤝";
  const label = outcome === "win" ? "勝利！" : outcome === "lose" ? "敗北..." : "引き分け";
  return (
    <div style={{ ...s.box, textAlign: "center", border: `2px solid ${color}`, marginBottom: "16px" }}>
      <div style={{ fontSize: "32px", marginBottom: "4px" }}>{icon}</div>
      <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>{label}</div>
      <div style={{ color: "#9ca3af", fontSize: "13px", marginBottom: "12px" }}>{msg}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "12px" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>{myName}</div>
          <div style={{ fontSize: "36px" }}>{myCard?.emoji}</div>
          <div style={{ fontSize: "10px", color: "#fbbf24" }}>+{myScore}</div>
        </div>
        <div style={{ fontSize: "20px", alignSelf: "center", color: "#6b7280" }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "11px", color: "#9ca3af", marginBottom: "2px" }}>{oppName}</div>
          <div style={{ fontSize: "36px" }}>{oppCard?.emoji}</div>
          <div style={{ fontSize: "10px", color: "#fbbf24" }}>+{oppScore}</div>
        </div>
      </div>
      <button style={s.btn()} onClick={onNext}>{round >= maxRounds ? "🏆 最終結果へ" : `➡️ 次のラウンド (${round+1}/${maxRounds})`}</button>
    </div>
  );
}

function GameOver({ myName, oppName, myScore, oppScore, onHome }) {
  const won = myScore > oppScore;
  const draw = myScore === oppScore;
  return (
    <div style={s.center}>
      <div style={{ fontSize: "64px", marginBottom: "8px" }}>{won ? "🏆" : draw ? "🤝" : "💀"}</div>
      <div style={s.title}>{won ? "勝利！" : draw ? "引き分け" : "敗北..."}</div>
      <div style={{ ...s.box, width: "100%", maxWidth: "320px" }}>
        <div style={s.row}><span>{myName} (YOU)</span><span style={{ fontWeight: "bold", fontSize: "22px", color: "#fbbf24" }}>{myScore}</span></div>
        <div style={s.row}><span>{oppName}</span><span style={{ fontWeight: "bold", fontSize: "22px", color: "#fbbf24" }}>{oppScore}</span></div>
      </div>
      <button style={s.btn()} onClick={onHome}>ホームに戻る</button>
    </div>
  );
}

// ========== ソロモード ==========
function SoloGame({ playerName, onHome }) {
  const MAX_ROUNDS = 5;
  const [round, setRound] = useState(1);
  const [hand] = useState(shuffle(CARDS).slice(0, 5));
  const [aiHand] = useState(shuffle(CARDS).slice(0, 5));
  const [selectedCard, setSelectedCard] = useState(null);
  const [phase, setPhase] = useState("select");
  const [roundResult, setRoundResult] = useState(null);
  const [aiCard, setAiCard] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });

  const submitCard = () => {
    if (!selectedCard) return;
    const ai = aiHand[Math.floor(Math.random() * aiHand.length)];
    setAiCard(ai);
    const r = calcResult(selectedCard, ai);
    setScores(prev => ({ player: prev.player + r.myScore, ai: prev.ai + r.oppScore }));
    setRoundResult(r);
    setPhase("result");
  };

  const nextRound = () => {
    if (round >= MAX_ROUNDS) { setPhase("gameover"); return; }
    setRound(r => r + 1);
    setSelectedCard(null); setAiCard(null); setRoundResult(null); setPhase("select");
  };

  if (phase === "gameover") return <GameOver myName={playerName} oppName="🤖 AI" myScore={scores.player} oppScore={scores.ai} onHome={onHome} />;

  return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div><div style={{ fontWeight: "bold" }}>{playerName} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {scores.player}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "#6b7280" }}>Round</div><div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "bold" }}>🤖 AI</div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {scores.ai}</div></div>
        </div>

        {phase === "result" && roundResult && (
          <ResultBox outcome={roundResult.outcome} msg={roundResult.msg} myCard={selectedCard} oppCard={aiCard} myName={playerName} oppName="AI" myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS} />
        )}

        {phase === "select" && (
          <>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>{hand.map(card => <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} />)}</div>
            <button style={s.btn(selectedCard ? "#7c3aed" : "#374151")} onClick={submitCard} disabled={!selectedCard}>
              {selectedCard ? `${selectedCard.emoji} カードを出す！` : "カードを選んでください"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ========== 対戦モード ==========
function MultiGame({ playerName, onHome }) {
  const MAX_ROUNDS = 5;
  const [screen, setScreen] = useState("lobby");
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [hand, setHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [round, setRound] = useState(1);

  useEffect(() => {
    if (!roomId) return;
    const unsub = onValue(ref(db, `rooms/${roomId}`), (snap) => {
      const data = snap.val();
      if (data) { setRoomData(data); if (data.status === "playing" && screen === "waiting") setScreen("game"); }
    });
    return () => unsub();
  }, [roomId, screen]);

  const createRoom = async () => {
    const newRef = push(ref(db, "rooms"));
    const id = newRef.key;
    const myHand = shuffle(CARDS).slice(0, 5);
    await set(newRef, { status: "waiting", p1: { name: playerName, hand: myHand, score: 0, ready: false }, round: 1 });
    setRoomId(id); setPlayerId("p1"); setHand(myHand); setScreen("waiting");
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;
    const myHand = shuffle(CARDS).slice(0, 5);
    await set(ref(db, `rooms/${joinRoomId}/p2`), { name: playerName, hand: myHand, score: 0, ready: false });
    await set(ref(db, `rooms/${joinRoomId}/status`), "playing");
    setRoomId(joinRoomId); setPlayerId("p2"); setHand(myHand); setScreen("game");
  };

  const submitCard = async () => {
    if (!selectedCard) return;
    await set(ref(db, `rooms/${roomId}/${playerId}/selected`), selectedCard.id);
    await set(ref(db, `rooms/${roomId}/${playerId}/ready`), true);
    setSelectedCard(null);
  };

  const nextRound = async () => {
    if (round >= MAX_ROUNDS) { setScreen("result"); return; }
    const nr = round + 1; setRound(nr);
    await set(ref(db, `rooms/${roomId}/p1/ready`), false);
    await set(ref(db, `rooms/${roomId}/p2/ready`), false);
    await set(ref(db, `rooms/${roomId}/p1/selected`), null);
    await set(ref(db, `rooms/${roomId}/p2/selected`), null);
    await set(ref(db, `rooms/${roomId}/round`), nr);
  };

  const myData = roomData?.[playerId];
  const oppId = playerId === "p1" ? "p2" : "p1";
  const oppData = roomData?.[oppId];
  const bothReady = roomData?.p1?.ready && roomData?.p2?.ready;

  let roundResult = null;
  let myPlayedCard = null, oppPlayedCard = null;
  if (bothReady && roomData?.p1?.selected && roomData?.p2?.selected) {
    const p1Card = CARDS.find(c => c.id === roomData.p1.selected);
    const p2Card = CARDS.find(c => c.id === roomData.p2.selected);
    if (p1Card && p2Card) {
      const r = calcResult(playerId === "p1" ? p1Card : p2Card, playerId === "p1" ? p2Card : p1Card);
      roundResult = r;
      myPlayedCard = playerId === "p1" ? p1Card : p2Card;
      oppPlayedCard = playerId === "p1" ? p2Card : p1Card;
    }
  }

  if (screen === "lobby") return (
    <div style={s.center}>
      <button style={{ ...s.btn("#374151"), width: "auto", padding: "8px 16px", marginBottom: "24px" }} onClick={onHome}>← 戻る</button>
      <div style={{ fontSize: "36px", marginBottom: "8px" }}>🌐</div>
      <div style={s.title}>対戦モード</div>
      <div style={{ ...s.sub, marginBottom: "16px" }}>{playerName} としてプレイ</div>
      <button style={s.btn()} onClick={createRoom}>🏠 ルームを作る</button>
      <div style={s.divider}><div style={s.line}/><span style={{ color: "#6b7280", fontSize: "14px" }}>または</span><div style={s.line}/></div>
      <input style={s.input} placeholder="ルームIDを入力" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)} />
      <button style={s.btn("#059669")} onClick={joinRoom}>🚪 ルームに参加</button>
    </div>
  );

  if (screen === "waiting") return (
    <div style={s.center}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
      <div style={s.title}>待機中...</div>
      <div style={s.sub}>このIDを友達に送ってください</div>
      <div style={{ ...s.box, width: "100%", maxWidth: "320px", textAlign: "center" }}>
        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>ルームID</div>
        <div style={{ fontSize: "14px", fontWeight: "bold", wordBreak: "break-all" }}>{roomId}</div>
      </div>
    </div>
  );

  if (screen === "result") {
    return <GameOver myName={myData?.name} oppName={oppData?.name} myScore={myData?.score ?? 0} oppScore={oppData?.score ?? 0} onHome={onHome} />;
  }

  return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div><div style={{ fontWeight: "bold" }}>{myData?.name} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {myData?.score ?? 0}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "#6b7280" }}>Round</div><div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "bold" }}>{oppData?.name ?? "?"}</div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {oppData?.score ?? 0}</div></div>
        </div>

        {bothReady && roundResult && (
          <ResultBox outcome={roundResult.outcome} msg={roundResult.msg} myCard={myPlayedCard} oppCard={oppPlayedCard} myName={myData?.name} oppName={oppData?.name} myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS} />
        )}

        {!myData?.ready && (
          <>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>{hand.map(card => <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} />)}</div>
            <button style={s.btn(selectedCard ? "#7c3aed" : "#374151")} onClick={submitCard} disabled={!selectedCard}>
              {selectedCard ? `${selectedCard.emoji} カードを出す！` : "カードを選んでください"}
            </button>
          </>
        )}

        {myData?.ready && !bothReady && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>⏳</div>
            <div style={{ color: "#9ca3af" }}>相手のカードを待っています...</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ========== ホーム ==========
export default function App() {
  const [mode, setMode] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);

  if (mode === "solo") return <SoloGame playerName={playerName} onHome={() => setMode("home")} />;
  if (mode === "multi") return <MultiGame playerName={playerName} onHome={() => setMode("home")} />;

  return (
    <div style={s.center}>
      <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚔️</div>
      <div style={s.title}>カードバトル</div>
      <div style={{ ...s.sub, marginBottom: "24px" }}>天敵システム搭載 ATKカードゲーム</div>
      {!nameEntered ? (
        <>
          <input style={s.input} placeholder="あなたの名前を入力" value={playerName} onChange={e => setPlayerName(e.target.value)} />
          <button style={s.btn(playerName.trim() ? "#7c3aed" : "#374151")} onClick={() => { if (playerName.trim()) setNameEntered(true); }} disabled={!playerName.trim()}>決定</button>
        </>
      ) : (
        <>
          <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "16px" }}>ようこそ、{playerName}さん！</div>
          <button style={s.btn("#059669")} onClick={() => setMode("solo")}>🤖 AIと対戦（1人モード）</button>
          <button style={s.btn()} onClick={() => setMode("multi")}>🌐 友達と対戦（2人モード）</button>
          <button style={{ ...s.btn("#374151"), marginTop: "4px" }} onClick={() => { setNameEntered(false); setPlayerName(""); }}>← 名前を変える</button>
        </>
      )}
    </div>
  );
}
