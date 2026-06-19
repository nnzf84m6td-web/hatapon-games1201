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

// 累計2回まで勝てる、3回目以降は疲労で負け
const FATIGUE_LIMIT = 2;
const FATIGUE_CARDS = ["c8", "c10"]; // ヒカリ、ノア

const CARDS = [
  { id: "c1",  name: "魔法使いの弟子 マナ",       emoji: "🧙",  atk: 8,  weakness: ["c6"] },
  { id: "c2",  name: "老いた海賊 ルヒィ",          emoji: "🏴‍☠️", atk: 12, weakness: [] },
  { id: "c3",  name: "はぐれ研究員 さとる",        emoji: "🔬",  atk: 6,  weakness: ["c6"] },
  { id: "c4",  name: "タイムパトロール トランクス", emoji: "⏰",  atk: 10, weakness: ["c7","c8"] },
  { id: "c5",  name: "孤独なロボット セブン",       emoji: "🤖",  atk: 7,  weakness: ["c7","c8"] },
  { id: "c6",  name: "うそつきの王様 ガイア",       emoji: "👑",  atk: 10, weakness: ["c4"] },
  { id: "c7",  name: "炎の女戦士 ホムラ",          emoji: "⚔️",  atk: 20, weakness: ["c3"] },
  { id: "c8",  name: "光の使者 ヒカリ",            emoji: "🧊",  atk: 40, weakness: ["c3"], fatigue: true },
  { id: "c9",  name: "風の使者 スバル",            emoji: "💨",  atk: 15, weakness: ["c7"] },
  { id: "c10", name: "最強戦士 ノア",              emoji: "🗡️",  atk: 40, weakness: ["c1"], fatigue: true },
  { id: "c11", name: "技術者 シュルク",            emoji: "🛠️",  atk: 20, weakness: ["c1"] },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

// 累計使用回数カウント
function getUseCount(cardId, history) {
  return history.filter(id => id === cardId).length;
}

// 勝敗判定
function calcResult(myCard, oppCard, myHistory, oppHistory) {
  // 疲労チェック
  const myFatigued = myCard.fatigue && getUseCount(myCard.id, myHistory) >= FATIGUE_LIMIT;
  const oppFatigued = oppCard.fatigue && getUseCount(oppCard.id, oppHistory) >= FATIGUE_LIMIT;

  if (myFatigued && oppFatigued) return {
    outcome: "draw", myScore: 0, oppScore: 0,
    msg: "両者疲労！引き分け",
    secret: `💤 ${myCard.name}（累計${getUseCount(myCard.id, myHistory)+1}回目）と${oppCard.name}（累計${getUseCount(oppCard.id, oppHistory)+1}回目）、両者力尽きた`,
  };
  if (myFatigued) return {
    outcome: "lose", myScore: 0, oppScore: oppCard.atk,
    msg: `${myCard.name}が力尽きた...`,
    secret: `💤 疲労敗北：${myCard.name}は累計${getUseCount(myCard.id, myHistory)+1}回目の出撃。限界を超えて敗北`,
  };
  if (oppFatigued) return {
    outcome: "win", myScore: myCard.atk, oppScore: 0,
    msg: `相手の${oppCard.name}が力尽きた！`,
    secret: `💤 相手疲労：${oppCard.name}は累計${getUseCount(oppCard.id, oppHistory)+1}回目の出撃で力尽きた`,
  };

  // 同じカード
  if (myCard.id === oppCard.id) return { outcome: "draw", myScore: 0, oppScore: 0, msg: "同じカード！引き分け", secret: null };

  // 天敵チェック
  const myWeak = myCard.weakness.includes(oppCard.id);
  const oppWeak = oppCard.weakness.includes(myCard.id);
  if (myWeak && oppWeak) return { outcome: "draw", myScore: 0, oppScore: 0, msg: "相性相殺！引き分け", secret: null };
  if (myWeak) return { outcome: "lose", myScore: 0, oppScore: oppCard.atk, msg: `${oppCard.name}は${myCard.name}の天敵！`, secret: null };
  if (oppWeak) return { outcome: "win", myScore: myCard.atk, oppScore: 0, msg: `${myCard.name}は${oppCard.name}の天敵！`, secret: null };

  // ATK勝負
  if (myCard.atk > oppCard.atk) return { outcome: "win", myScore: myCard.atk - oppCard.atk, oppScore: 0, msg: `ATK勝負！${myCard.name}の勝ち`, secret: null };
  if (oppCard.atk > myCard.atk) return { outcome: "lose", myScore: 0, oppScore: oppCard.atk - myCard.atk, msg: `ATK勝負！${oppCard.name}の勝ち`, secret: null };
  return { outcome: "draw", myScore: 0, oppScore: 0, msg: "ATK同値！引き分け", secret: null };
}

const s = {
  app: { minHeight: "100vh", backgroundColor: "#030712", color: "white", padding: "16px", fontFamily: "sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "16px" },
  title: { fontSize: "28px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" },
  sub: { color: "#9ca3af", fontSize: "14px", marginBottom: "24px", textAlign: "center" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #374151", backgroundColor: "#111827", color: "white", fontSize: "16px", marginBottom: "12px", boxSizing: "border-box" },
  btn: (color="#7c3aed") => ({ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: color, color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "8px" }),
  card: (selected, fatigued) => ({
    cursor: "pointer",
    borderRadius: "12px",
    border: `2px solid ${selected ? "#a78bfa" : fatigued ? "#f87171" : "#374151"}`,
    padding: "10px 6px",
    backgroundColor: selected ? "rgba(109,40,217,0.3)" : fatigued ? "rgba(239,68,68,0.1)" : "#111827",
    transform: selected ? "scale(1.05)" : "scale(1)",
    transition: "all 0.2s",
    textAlign: "center",
    position: "relative",
  }),
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" },
  box: { backgroundColor: "#111827", borderRadius: "16px", padding: "16px", marginBottom: "12px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  badge: (color) => ({ backgroundColor: color, borderRadius: "6px", padding: "2px 8px", fontSize: "11px", fontWeight: "bold" }),
  divider: { display: "flex", alignItems: "center", gap: "8px", margin: "8px 0" },
  line: { flex: 1, height: "1px", backgroundColor: "#374151" },
  secretBox: { backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: "8px", padding: "10px 12px", marginTop: "8px", fontSize: "12px", color: "#fcd34d" },
};

function CardView({ card, selected, onClick, useCount }) {
  const weakNames = card.weakness.map(wid => CARDS.find(c => c.id === wid)?.emoji).join(" ");
  const remaining = card.fatigue ? Math.max(0, FATIGUE_LIMIT - useCount) : null;
  const fatigued = card.fatigue && useCount >= FATIGUE_LIMIT;
  return (
    <div style={s.card(selected, fatigued)} onClick={onClick}>
      {fatigued && <div style={{ position: "absolute", top: "4px", right: "4px", fontSize: "10px" }}>💤</div>}
      <div style={{ fontSize: "26px", marginBottom: "2px" }}>{card.emoji}</div>
      <div style={{ fontSize: "9px", fontWeight: "bold", marginBottom: "2px", lineHeight: "1.3", color: fatigued ? "#f87171" : "white" }}>{card.name}</div>
      <div style={{ backgroundColor: fatigued ? "#6b7280" : "#dc2626", borderRadius: "4px", padding: "2px 6px", fontSize: "11px", fontWeight: "bold", display: "inline-block", marginBottom: "2px" }}>
        ATK {fatigued ? "?" : card.atk}
      </div>
      {weakNames && (
        <div style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "4px", padding: "1px 4px", fontSize: "9px", color: "#fca5a5", marginTop: "2px" }}>
          弱点 {weakNames}
        </div>
      )}

      {fatigued && <div style={{ fontSize: "9px", color: "#f87171", marginTop: "2px" }}>疲労限界</div>}
    </div>
  );
}

function ResultBox({ outcome, msg, secret, myCard, oppCard, myName, oppName, myScore, oppScore, onNext, round, maxRounds }) {
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
      {secret && <div style={s.secretBox}>🔍 裏ステータス<br/>{secret}</div>}
      <button style={{ ...s.btn(), marginTop: "12px" }} onClick={onNext}>
        {round >= maxRounds ? "🏆 最終結果へ" : `➡️ 次のラウンド (${round+1}/${maxRounds})`}
      </button>
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
  const [hand] = useState(shuffle(CARDS).slice(0, 6));
  const [aiHand] = useState(shuffle(CARDS).slice(0, 6));
  const [selectedCard, setSelectedCard] = useState(null);
  const [phase, setPhase] = useState("select");
  const [roundResult, setRoundResult] = useState(null);
  const [aiCard, setAiCard] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [myHistory, setMyHistory] = useState([]);
  const [aiHistory, setAiHistory] = useState([]);

  const submitCard = () => {
    if (!selectedCard) return;
    const ai = aiHand[Math.floor(Math.random() * aiHand.length)];
    setAiCard(ai);
    const r = calcResult(selectedCard, ai, myHistory, aiHistory);
    setMyHistory(prev => [...prev, selectedCard.id]);
    setAiHistory(prev => [...prev, ai.id]);
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
          <ResultBox outcome={roundResult.outcome} msg={roundResult.msg} secret={roundResult.secret} myCard={selectedCard} oppCard={aiCard} myName={playerName} oppName="AI" myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS} />
        )}
        {phase === "select" && (
          <>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>
              {hand.map(card => <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} useCount={getUseCount(card.id, myHistory)} />)}
            </div>
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
  const [myHistory, setMyHistory] = useState([]);

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
    const myHand = shuffle(CARDS).slice(0, 6);
    await set(newRef, { status: "waiting", p1: { name: playerName, hand: myHand, score: 0, ready: false, history: [] }, round: 1 });
    setRoomId(id); setPlayerId("p1"); setHand(myHand); setScreen("waiting");
  };

  const joinRoom = async () => {
    if (!joinRoomId.trim()) return;
    const myHand = shuffle(CARDS).slice(0, 6);
    await set(ref(db, `rooms/${joinRoomId}/p2`), { name: playerName, hand: myHand, score: 0, ready: false, history: [] });
    await set(ref(db, `rooms/${joinRoomId}/status`), "playing");
    setRoomId(joinRoomId); setPlayerId("p2"); setHand(myHand); setScreen("game");
  };

  const submitCard = async () => {
    if (!selectedCard) return;
    const newHistory = [...myHistory, selectedCard.id];
    setMyHistory(newHistory);
    await set(ref(db, `rooms/${roomId}/${playerId}/selected`), selectedCard.id);
    await set(ref(db, `rooms/${roomId}/${playerId}/history`), newHistory);
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

  let roundResult = null, myPlayedCard = null, oppPlayedCard = null;
  if (bothReady && roomData?.p1?.selected && roomData?.p2?.selected) {
    const p1Card = CARDS.find(c => c.id === roomData.p1.selected);
    const p2Card = CARDS.find(c => c.id === roomData.p2.selected);
    if (p1Card && p2Card) {
      const myCard = playerId === "p1" ? p1Card : p2Card;
      const oppCard = playerId === "p1" ? p2Card : p1Card;
      const myHist = (roomData[playerId]?.history || []).slice(0, -1);
      const oppHist = (roomData[oppId]?.history || []).slice(0, -1);
      roundResult = calcResult(myCard, oppCard, myHist, oppHist);
      myPlayedCard = myCard; oppPlayedCard = oppCard;
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

  if (screen === "result") return <GameOver myName={myData?.name} oppName={oppData?.name} myScore={myData?.score ?? 0} oppScore={oppData?.score ?? 0} onHome={onHome} />;

  return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div><div style={{ fontWeight: "bold" }}>{myData?.name} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {myData?.score ?? 0}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "11px", color: "#6b7280" }}>Round</div><div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "bold" }}>{oppData?.name ?? "?"}</div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {oppData?.score ?? 0}</div></div>
        </div>
        {bothReady && roundResult && (
          <ResultBox outcome={roundResult.outcome} msg={roundResult.msg} secret={roundResult.secret} myCard={myPlayedCard} oppCard={oppPlayedCard} myName={myData?.name} oppName={oppData?.name} myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS} />
        )}
        {!myData?.ready && (
          <>
            <div style={{ fontSize: "13px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>
              {hand.map(card => <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} useCount={getUseCount(card.id, myHistory)} />)}
            </div>
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
      <div style={{ ...s.sub, marginBottom: "24px" }}>天敵＆疲労システム搭載</div>
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
