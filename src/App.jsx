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
  { id: "c1", name: "魔法使いの弟子 マナ", emoji: "🧙", atk: 2000, def: 1800 },
  { id: "c2", name: "老いた海賊 ルヒィ", emoji: "🏴‍☠️", atk: 1200, def: 400 },
  { id: "c3", name: "はぐれ研究員 さとる", emoji: "🔬", atk: 600, def: 1100 },
  { id: "c4", name: "タイムパトロール トランクス", emoji: "⏰", atk: 1000, def: 800 },
  { id: "c5", name: "孤独なロボット セブン", emoji: "🤖", atk: 700, def: 700 },
  { id: "c6", name: "うそつきの王様 ガイア", emoji: "👑", atk: 100, def: 1300 },
  { id: "c7", name: "炎の女戦士 ホムラ", emoji: "⚔️", atk: 3000, def: 2500 },
  { id: "c8", name: "光の使者 ヒカリ", emoji: "🧊", atk: 4000, def: 2000 },
  { id: "c9", name: "風の使者 スバル", emoji: "💨", atk: 1100, def: 700 },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

const s = {
  app: { minHeight: "100vh", backgroundColor: "#030712", color: "white", padding: "16px", fontFamily: "sans-serif" },
  center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "16px" },
  title: { fontSize: "28px", fontWeight: "bold", marginBottom: "8px", textAlign: "center" },
  sub: { color: "#9ca3af", fontSize: "14px", marginBottom: "32px", textAlign: "center" },
  input: { width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid #374151", backgroundColor: "#111827", color: "white", fontSize: "16px", marginBottom: "12px", boxSizing: "border-box" },
  btn: (color="#7c3aed") => ({ width: "100%", padding: "14px", borderRadius: "12px", border: "none", backgroundColor: color, color: color==="#f59e0b"?"black":"white", fontWeight: "bold", fontSize: "16px", cursor: "pointer", marginBottom: "8px" }),
  card: (selected) => ({ cursor: "pointer", borderRadius: "12px", border: `2px solid ${selected ? "#a78bfa" : "#374151"}`, padding: "12px", backgroundColor: selected ? "rgba(109,40,217,0.3)" : "#111827", transform: selected ? "scale(1.05)" : "scale(1)", transition: "all 0.2s", textAlign: "center" }),
  grid: { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" },
  box: { backgroundColor: "#111827", borderRadius: "16px", padding: "16px", marginBottom: "12px" },
  row: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" },
  badge: (color) => ({ backgroundColor: color, borderRadius: "6px", padding: "2px 8px", fontSize: "12px", fontWeight: "bold" }),
  statRow: { display: "flex", gap: "8px", justifyContent: "center", marginTop: "4px" },
  stat: (color) => ({ backgroundColor: color, borderRadius: "6px", padding: "3px 10px", fontSize: "13px", fontWeight: "bold", color: "white" }),
  divider: { display: "flex", alignItems: "center", gap: "8px", margin: "8px 0" },
  line: { flex: 1, height: "1px", backgroundColor: "#374151" },
};

function CardView({ card, selected, onClick }) {
  return (
    <div style={s.card(selected)} onClick={onClick}>
      <div style={{ fontSize: "32px", marginBottom: "4px" }}>{card.emoji}</div>
      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{card.name}</div>
      <div style={s.statRow}>
        <span style={s.stat("#dc2626")}>ATK {card.atk}</span>
        <span style={s.stat("#2563eb")}>DEF {card.def}</span>
      </div>
    </div>
  );
}

function calcResult(p1Card, p2Card, p1Name, p2Name) {
  if (p1Card.id === p2Card.id) return { type: "draw", msg: "同じカード！両方0点", p1Score: 0, p2Score: 0 };
  if (p1Card.atk > p2Card.def) return { type: "p1win", msg: `${p1Name}の攻撃成功！`, p1Score: p1Card.atk - p2Card.def, p2Score: 0 };
  if (p2Card.atk > p1Card.def) return { type: "p2win", msg: `${p2Name}の攻撃成功！`, p1Score: 0, p2Score: p2Card.atk - p1Card.def };
  return { type: "draw", msg: "防御成功！引き分け", p1Score: 0, p2Score: 0 };
}

// ========== ソロモード ==========
function SoloGame({ playerName, onHome }) {
  const MAX_ROUNDS = 5;
  const [round, setRound] = useState(1);
  const [hand] = useState(shuffle(CARDS).slice(0, 5));
  const [aiHand] = useState(shuffle(CARDS).slice(0, 5));
  const [selectedCard, setSelectedCard] = useState(null);
  const [phase, setPhase] = useState("select"); // select | result | gameover
  const [roundResult, setRoundResult] = useState(null);
  const [scores, setScores] = useState({ player: 0, ai: 0 });
  const [aiCard, setAiCard] = useState(null);

  const submitCard = () => {
    if (!selectedCard) return;
    const ai = aiHand[Math.floor(Math.random() * aiHand.length)];
    setAiCard(ai);
    const result = calcResult(selectedCard, ai, playerName, "AI");
    setRoundResult(result);
    setScores(prev => ({
      player: prev.player + result.p1Score,
      ai: prev.ai + result.p2Score,
    }));
    setPhase("result");
  };

  const nextRound = () => {
    if (round >= MAX_ROUNDS) { setPhase("gameover"); return; }
    setRound(r => r + 1);
    setSelectedCard(null);
    setAiCard(null);
    setRoundResult(null);
    setPhase("select");
  };

  if (phase === "gameover") {
    const won = scores.player > scores.ai;
    const draw = scores.player === scores.ai;
    return (
      <div style={s.center}>
        <div style={{ fontSize: "64px", marginBottom: "8px" }}>{won ? "🏆" : draw ? "🤝" : "💀"}</div>
        <div style={s.title}>{won ? "勝利！" : draw ? "引き分け" : "敗北..."}</div>
        <div style={{ ...s.box, width: "100%", maxWidth: "320px" }}>
          <div style={s.row}><span>{playerName} (YOU)</span><span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{scores.player}</span></div>
          <div style={s.row}><span>🤖 AI</span><span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{scores.ai}</span></div>
        </div>
        <button style={s.btn()} onClick={onHome}>ホームに戻る</button>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* ヘッダー */}
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: "bold" }}>{playerName} <span style={s.badge("#7c3aed")}>YOU</span></div>
            <div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {scores.player}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Round</div>
            <div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>🤖 AI</div>
            <div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {scores.ai}</div>
          </div>
        </div>

        {/* 結果表示 */}
        {phase === "result" && roundResult && (
          <div style={{ ...s.box, textAlign: "center", border: `2px solid ${roundResult.type === "p1win" ? "#34d399" : roundResult.type === "p2win" ? "#f87171" : "#fbbf24"}`, marginBottom: "16px" }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>
              {roundResult.type === "p1win" ? "🎉" : roundResult.type === "p2win" ? "💀" : "🤝"}
            </div>
            <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
              {roundResult.type === "p1win" ? "勝利！" : roundResult.type === "p2win" ? "敗北..." : "引き分け"}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "12px" }}>{roundResult.msg}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>{playerName}</div>
                <div style={{ fontSize: "36px" }}>{selectedCard?.emoji}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{selectedCard?.name}</div>
              </div>
              <div style={{ fontSize: "20px", alignSelf: "center", color: "#6b7280" }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>🤖 AI</div>
                <div style={{ fontSize: "36px" }}>{aiCard?.emoji}</div>
                <div style={{ fontSize: "11px", color: "#9ca3af" }}>{aiCard?.name}</div>
              </div>
            </div>
            <button style={s.btn()} onClick={nextRound}>
              {round >= MAX_ROUNDS ? "🏆 最終結果へ" : "➡️ 次のラウンド"}
            </button>
          </div>
        )}

        {/* カード選択 */}
        {phase === "select" && (
          <>
            <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>
              {hand.map(card => (
                <CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} />
              ))}
            </div>
            <button
              style={s.btn(selectedCard ? "#7c3aed" : "#374151")}
              onClick={submitCard}
              disabled={!selectedCard}
            >
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
  const [screen, setScreen] = useState("lobby"); // lobby | waiting | game | result
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [playerId, setPlayerId] = useState(null);
  const [hand, setHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [round, setRound] = useState(1);
  const MAX_ROUNDS = 5;

  useEffect(() => {
    if (!roomId) return;
    const roomRef = ref(db, `rooms/${roomId}`);
    const unsub = onValue(roomRef, (snap) => {
      const data = snap.val();
      if (data) {
        setRoomData(data);
        if (data.status === "playing" && screen === "waiting") setScreen("game");
      }
    });
    return () => unsub();
  }, [roomId, screen]);

  const createRoom = async () => {
    const newRoomRef = push(ref(db, "rooms"));
    const id = newRoomRef.key;
    const myHand = shuffle(CARDS).slice(0, 5);
    await set(newRoomRef, { status: "waiting", p1: { name: playerName, hand: myHand, score: 0, ready: false }, round: 1 });
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
    const newRound = round + 1;
    setRound(newRound);
    await set(ref(db, `rooms/${roomId}/p1/ready`), false);
    await set(ref(db, `rooms/${roomId}/p2/ready`), false);
    await set(ref(db, `rooms/${roomId}/p1/selected`), null);
    await set(ref(db, `rooms/${roomId}/p2/selected`), null);
    await set(ref(db, `rooms/${roomId}/round`), newRound);
  };

  const myData = roomData?.[playerId];
  const oppId = playerId === "p1" ? "p2" : "p1";
  const oppData = roomData?.[oppId];
  const bothReady = roomData?.p1?.ready && roomData?.p2?.ready;

  let roundResult = null;
  if (bothReady && roomData?.p1?.selected && roomData?.p2?.selected) {
    const p1Card = CARDS.find(c => c.id === roomData.p1.selected);
    const p2Card = CARDS.find(c => c.id === roomData.p2.selected);
    if (p1Card && p2Card) {
      const r = calcResult(p1Card, p2Card, roomData.p1.name, roomData.p2.name);
      roundResult = { ...r, type: playerId === "p1" ? (r.type === "p1win" ? "win" : r.type === "p2win" ? "lose" : "draw") : (r.type === "p2win" ? "win" : r.type === "p1win" ? "lose" : "draw") };
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
        <div style={{ fontSize: "16px", fontWeight: "bold", wordBreak: "break-all" }}>{roomId}</div>
      </div>
    </div>
  );

  if (screen === "result") {
    const myScore = myData?.score ?? 0;
    const oppScore = oppData?.score ?? 0;
    const won = myScore > oppScore;
    return (
      <div style={s.center}>
        <div style={{ fontSize: "64px", marginBottom: "8px" }}>{won ? "🏆" : myScore === oppScore ? "🤝" : "💀"}</div>
        <div style={s.title}>{won ? "勝利！" : myScore === oppScore ? "引き分け" : "敗北..."}</div>
        <div style={{ ...s.box, width: "100%", maxWidth: "320px" }}>
          <div style={s.row}><span>{myData?.name} (YOU)</span><span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{myScore}</span></div>
          <div style={s.row}><span>{oppData?.name}</span><span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{oppScore}</span></div>
        </div>
        <button style={s.btn()} onClick={onHome}>ホームに戻る</button>
      </div>
    );
  }

  return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div><div style={{ fontWeight: "bold" }}>{myData?.name} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {myData?.score ?? 0}</div></div>
          <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#6b7280" }}>Round</div><div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{ textAlign: "right" }}><div style={{ fontWeight: "bold" }}>{oppData?.name ?? "?"}</div><div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {oppData?.score ?? 0}</div></div>
        </div>

        {bothReady && roundResult && (
          <div style={{ ...s.box, textAlign: "center", border: `2px solid ${roundResult.type === "win" ? "#34d399" : roundResult.type === "lose" ? "#f87171" : "#fbbf24"}` }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>{roundResult.type === "win" ? "🎉" : roundResult.type === "lose" ? "💀" : "🤝"}</div>
            <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>{roundResult.type === "win" ? "勝利！" : roundResult.type === "lose" ? "敗北..." : "引き分け"}</div>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "12px" }}>{roundResult.msg}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "32px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>{roomData?.p1?.name}</div><div style={{ fontSize: "36px" }}>{CARDS.find(c=>c.id===roomData?.p1?.selected)?.emoji}</div></div>
              <div style={{ fontSize: "20px", alignSelf: "center", color: "#6b7280" }}>VS</div>
              <div style={{ textAlign: "center" }}><div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>{roomData?.p2?.name}</div><div style={{ fontSize: "36px" }}>{CARDS.find(c=>c.id===roomData?.p2?.selected)?.emoji}</div></div>
            </div>
            <button style={s.btn()} onClick={nextRound}>{round >= MAX_ROUNDS ? "🏆 最終結果へ" : "➡️ 次のラウンド"}</button>
          </div>
        )}

        {!myData?.ready && (
          <>
            <div style={{ fontSize: "14px", color: "#9ca3af", marginBottom: "8px" }}>カードを選んで出す</div>
            <div style={s.grid}>{hand.map(card => (<CardView key={card.id} card={card} selected={selectedCard?.id === card.id} onClick={() => setSelectedCard(card)} />))}</div>
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

// ========== ホーム画面 ==========
export default function App() {
  const [mode, setMode] = useState("home"); // home | solo | multi
  const [playerName, setPlayerName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);

  if (mode === "solo") return <SoloGame playerName={playerName} onHome={() => setMode("home")} />;
  if (mode === "multi") return <MultiGame playerName={playerName} onHome={() => setMode("home")} />;

  return (
    <div style={s.center}>
      <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚔️</div>
      <div style={s.title}>カードバトル</div>
      <div style={{ ...s.sub, marginBottom: "24px" }}>ATK vs DEF カードゲーム</div>
      {!nameEntered ? (
        <>
          <input style={s.input} placeholder="あなたの名前を入力" value={playerName} onChange={e => setPlayerName(e.target.value)} />
          <button style={s.btn(playerName.trim() ? "#7c3aed" : "#374151")} onClick={() => { if (playerName.trim()) setNameEntered(true); }} disabled={!playerName.trim()}>
            決定
          </button>
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
