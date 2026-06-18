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
  { id: "c1", name: "迷子の魔法使い", emoji: "🧙", atk: 800, def: 600 },
  { id: "c2", name: "老いた海賊", emoji: "🏴‍☠️", atk: 1200, def: 400 },
  { id: "c3", name: "眠れない科学者", emoji: "🔬", atk: 600, def: 1100 },
  { id: "c4", name: "時間泥棒", emoji: "⏰", atk: 1000, def: 800 },
  { id: "c5", name: "孤独なロボット", emoji: "🤖", atk: 900, def: 1000 },
  { id: "c6", name: "うそつきの王様", emoji: "👑", atk: 700, def: 1300 },
  { id: "c7", name: "炎の戦士", emoji: "⚔️", atk: 1500, def: 300 },
  { id: "c8", name: "氷の魔女", emoji: "🧊", atk: 500, def: 1400 },
  { id: "c9", name: "風の使者", emoji: "💨", atk: 1100, def: 700 },
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
};

function CardView({ card, selected, onClick, showStats=true }) {
  return (
    <div style={s.card(selected)} onClick={onClick}>
      <div style={{ fontSize: "32px", marginBottom: "4px" }}>{card.emoji}</div>
      <div style={{ fontSize: "12px", fontWeight: "bold", marginBottom: "4px" }}>{card.name}</div>
      {showStats && (
        <div style={s.statRow}>
          <span style={s.stat("#dc2626")}>ATK {card.atk}</span>
          <span style={s.stat("#2563eb")}>DEF {card.def}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("home"); // home | waiting | game | result
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [playerId, setPlayerId] = useState(null); // "p1" | "p2"
  const [hand, setHand] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [roomData, setRoomData] = useState(null);
  const [round, setRound] = useState(1);
  const MAX_ROUNDS = 5;

  // Firebase監視
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
    if (!playerName.trim()) return;
    const newRoomRef = push(ref(db, "rooms"));
    const id = newRoomRef.key;
    const myHand = shuffle(CARDS).slice(0, 5);
    await set(newRoomRef, {
      status: "waiting",
      p1: { name: playerName, hand: myHand, score: 0, ready: false },
      round: 1,
    });
    setRoomId(id);
    setPlayerId("p1");
    setHand(myHand);
    setScreen("waiting");
  };

  const joinRoom = async () => {
    if (!playerName.trim() || !joinRoomId.trim()) return;
    const myHand = shuffle(CARDS).slice(0, 5);
    await set(ref(db, `rooms/${joinRoomId}/p2`), { name: playerName, hand: myHand, score: 0, ready: false });
    await set(ref(db, `rooms/${joinRoomId}/status`), "playing");
    setRoomId(joinRoomId);
    setPlayerId("p2");
    setHand(myHand);
    setScreen("game");
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

  // 勝敗判定
  let roundResult = null;
  if (bothReady && roomData?.p1?.selected && roomData?.p2?.selected) {
    const p1Card = CARDS.find(c => c.id === roomData.p1.selected);
    const p2Card = CARDS.find(c => c.id === roomData.p2.selected);
    if (p1Card && p2Card) {
      if (p1Card.id === p2Card.id) {
        roundResult = { type: "draw", msg: "同じカード！両方0点", p1Score: 0, p2Score: 0 };
      } else if (p1Card.atk > p2Card.def) {
        roundResult = { type: playerId === "p1" ? "win" : "lose", msg: `${roomData.p1.name}の攻撃成功！`, p1Score: p1Card.atk - p2Card.def, p2Score: 0 };
      } else if (p2Card.atk > p1Card.def) {
        roundResult = { type: playerId === "p2" ? "win" : "lose", msg: `${roomData.p2.name}の攻撃成功！`, p1Score: 0, p2Score: p2Card.atk - p1Card.def };
      } else {
        roundResult = { type: "draw", msg: "防御成功！引き分け", p1Score: 0, p2Score: 0 };
      }
    }
  }

  // ホーム画面
  if (screen === "home") return (
    <div style={s.center}>
      <div style={{ fontSize: "48px", marginBottom: "8px" }}>⚔️</div>
      <div style={s.title}>カードバトル</div>
      <div style={s.sub}>ATK vs DEF リアルタイム対戦</div>
      <input style={s.input} placeholder="あなたの名前" value={playerName} onChange={e => setPlayerName(e.target.value)} />
      <button style={s.btn()} onClick={createRoom}>🏠 ルームを作る</button>
      <div style={{ color: "#6b7280", margin: "8px 0", fontSize: "14px" }}>または</div>
      <input style={s.input} placeholder="ルームIDを入力" value={joinRoomId} onChange={e => setJoinRoomId(e.target.value)} />
      <button style={s.btn("#059669")} onClick={joinRoom}>🚪 ルームに参加</button>
    </div>
  );

  // 待機画面
  if (screen === "waiting") return (
    <div style={s.center}>
      <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
      <div style={s.title}>待機中...</div>
      <div style={s.sub}>このIDを友達に送ってください</div>
      <div style={{ ...s.box, width: "100%", maxWidth: "320px", textAlign: "center" }}>
        <div style={{ fontSize: "12px", color: "#9ca3af", marginBottom: "4px" }}>ルームID</div>
        <div style={{ fontSize: "18px", fontWeight: "bold", wordBreak: "break-all" }}>{roomId}</div>
      </div>
      <div style={{ color: "#9ca3af", fontSize: "13px" }}>友達が参加すると自動でゲーム開始！</div>
    </div>
  );

  // ゲーム画面
  if (screen === "game") return (
    <div style={s.app}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        {/* ヘッダー */}
        <div style={{ ...s.row, marginBottom: "16px" }}>
          <div>
            <div style={{ fontWeight: "bold" }}>{myData?.name} <span style={s.badge("#7c3aed")}>YOU</span></div>
            <div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {myData?.score ?? 0}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "12px", color: "#6b7280" }}>Round</div>
            <div style={{ fontWeight: "bold", fontSize: "20px" }}>{round}/{MAX_ROUNDS}</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: "bold" }}>{oppData?.name ?? "?"} <span style={s.badge("#374151")}>相手</span></div>
            <div style={{ color: "#fbbf24", fontSize: "14px" }}>スコア: {oppData?.score ?? 0}</div>
          </div>
        </div>

        {/* 結果表示 */}
        {bothReady && roundResult && (
          <div style={{ ...s.box, textAlign: "center", border: `2px solid ${roundResult.type === "win" ? "#34d399" : roundResult.type === "lose" ? "#f87171" : "#fbbf24"}` }}>
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>
              {roundResult.type === "win" ? "🎉" : roundResult.type === "lose" ? "💀" : "🤝"}
            </div>
            <div style={{ fontWeight: "bold", fontSize: "18px", marginBottom: "4px" }}>
              {roundResult.type === "win" ? "勝利！" : roundResult.type === "lose" ? "敗北..." : "引き分け"}
            </div>
            <div style={{ color: "#9ca3af", fontSize: "14px", marginBottom: "12px" }}>{roundResult.msg}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", marginBottom: "12px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>{roomData?.p1?.name}</div>
                <div style={{ fontSize: "20px" }}>{CARDS.find(c=>c.id===roomData?.p1?.selected)?.emoji}</div>
              </div>
              <div style={{ fontSize: "24px", alignSelf: "center" }}>VS</div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "12px", color: "#9ca3af" }}>{roomData?.p2?.name}</div>
                <div style={{ fontSize: "20px" }}>{CARDS.find(c=>c.id===roomData?.p2?.selected)?.emoji}</div>
              </div>
            </div>
            <button style={s.btn()} onClick={nextRound}>
              {round >= MAX_ROUNDS ? "🏆 最終結果へ" : "➡️ 次のラウンド"}
            </button>
          </div>
        )}

        {/* カード選択 */}
        {!myData?.ready && (
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

        {/* 待機中 */}
        {myData?.ready && !bothReady && (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{ fontSize: "36px", marginBottom: "8px" }}>⏳</div>
            <div style={{ color: "#9ca3af" }}>相手のカードを待っています...</div>
          </div>
        )}
      </div>
    </div>
  );

  // 結果画面
  if (screen === "result") {
    const p1Score = roomData?.p1?.score ?? 0;
    const p2Score = roomData?.p2?.score ?? 0;
    const myScore = playerId === "p1" ? p1Score : p2Score;
    const oppScore = playerId === "p1" ? p2Score : p1Score;
    const won = myScore > oppScore;
    return (
      <div style={s.center}>
        <div style={{ fontSize: "64px", marginBottom: "8px" }}>{won ? "🏆" : myScore === oppScore ? "🤝" : "💀"}</div>
        <div style={s.title}>{won ? "勝利！" : myScore === oppScore ? "引き分け" : "敗北..."}</div>
        <div style={{ ...s.box, width: "100%", maxWidth: "320px" }}>
          <div style={{ ...s.row }}>
            <span>{myData?.name} (YOU)</span>
            <span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{myScore}</span>
          </div>
          <div style={s.row}>
            <span>{oppData?.name}</span>
            <span style={{ fontWeight: "bold", fontSize: "20px", color: "#fbbf24" }}>{oppScore}</span>
          </div>
        </div>
        <button style={s.btn()} onClick={() => { setScreen("home"); setRoomId(""); setRoomData(null); setRound(1); }}>
          もう一度プレイ
        </button>
      </div>
    );
  }

  return null;
}
