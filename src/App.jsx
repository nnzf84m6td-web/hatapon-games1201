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

const FATIGUE_LIMIT = 2;

const CARDS = [
  { id: "c1",  name: "魔法使いの弟子 マナ",       emoji: "🧙", atk: 8,  weakness: ["c6"],       fatigue: false, color: ["#7c3aed","#4f46e5"], symbol: "✦", pattern: "stars",  label: "MAGE" },
  { id: "c2",  name: "老いた海賊 ルヒィ",          emoji: "🏴‍☠️",atk: 12, weakness: [],           fatigue: false, color: ["#1e3a5f","#0f766e"], symbol: "☠", pattern: "waves",  label: "PIRATE" },
  { id: "c3",  name: "はぐれ研究員 さとる",        emoji: "🔬", atk: 6,  weakness: ["c6"],       fatigue: false, color: ["#065f46","#047857"], symbol: "⚗", pattern: "dots",   label: "SCIENCE" },
  { id: "c4",  name: "タイムパトロール トランクス", emoji: "⏰", atk: 10, weakness: ["c7","c8"],  fatigue: false, color: ["#1d4ed8","#0369a1"], symbol: "⧖", pattern: "grid",   label: "TIME" },
  { id: "c5",  name: "孤独なロボット セブン",       emoji: "🤖", atk: 7,  weakness: ["c7","c8"],  fatigue: false, color: ["#374151","#1f2937"], symbol: "◈", pattern: "circuit",label: "ROBOT" },
  { id: "c6",  name: "うそつきの王様 ガイア",       emoji: "👑", atk: 10, weakness: ["c4"],       fatigue: false, color: ["#92400e","#b45309"], symbol: "♛", pattern: "diamonds",label:"KING" },
  { id: "c7",  name: "炎の女戦士 ホムラ",          emoji: "⚔️", atk: 20, weakness: ["c3"],       fatigue: false, color: ["#991b1b","#dc2626"], symbol: "🔥", pattern: "flames", label: "FIRE" },
  { id: "c8",  name: "光の使者 ヒカリ",            emoji: "🧊", atk: 40, weakness: ["c3"],       fatigue: true,  color: ["#0c4a6e","#0284c7"], symbol: "✶", pattern: "rays",   label: "LIGHT" },
  { id: "c9",  name: "風の使者 スバル",            emoji: "💨", atk: 15, weakness: ["c7"],       fatigue: false, color: ["#164e63","#0891b2"], symbol: "≋", pattern: "wind",   label: "WIND" },
  { id: "c10", name: "最強戦士 ノア",              emoji: "🗡️", atk: 40, weakness: ["c1"],       fatigue: true,  color: ["#3b0764","#6d28d9"], symbol: "⚔", pattern: "blades", label: "HERO" },
  { id: "c11", name: "技術者 シュルク",            emoji: "🛠️", atk: 20, weakness: ["c1"],       fatigue: false, color: ["#713f12","#a16207"], symbol: "⚙", pattern: "gears",  label: "TECH" },
];

function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }
function getUseCount(cardId, history) { return history.filter(id => id === cardId).length; }

function calcResult(myCard, oppCard, myHistory, oppHistory) {
  const myFatigued = myCard.fatigue && getUseCount(myCard.id, myHistory) >= FATIGUE_LIMIT;
  const oppFatigued = oppCard.fatigue && getUseCount(oppCard.id, oppHistory) >= FATIGUE_LIMIT;
  if (myFatigued && oppFatigued) return { outcome: "draw", myScore: 0, oppScore: 0, msg: "両者疲労！引き分け", secret: `💤 ${myCard.name}と${oppCard.name}、両者力尽きた` };
  if (myFatigued) return { outcome: "lose", myScore: 0, oppScore: oppCard.atk, msg: `${myCard.name}が力尽きた...`, secret: `💤 疲労敗北：${myCard.name}は累計${getUseCount(myCard.id, myHistory)+1}回目の出撃で限界を超えた` };
  if (oppFatigued) return { outcome: "win", myScore: myCard.atk, oppScore: 0, msg: `相手の${oppCard.name}が力尽きた！`, secret: `💤 相手疲労：${oppCard.name}は累計${getUseCount(oppCard.id, oppHistory)+1}回目の出撃で力尽きた` };
  if (myCard.id === oppCard.id) return { outcome: "draw", myScore: 0, oppScore: 0, msg: "同じカード！引き分け", secret: null };
  const myWeak = myCard.weakness.includes(oppCard.id);
  const oppWeak = oppCard.weakness.includes(myCard.id);
  if (myWeak && oppWeak) return { outcome: "draw", myScore: 0, oppScore: 0, msg: "相性相殺！引き分け", secret: null };
  if (myWeak) return { outcome: "lose", myScore: 0, oppScore: oppCard.atk, msg: `${oppCard.name}は${myCard.name}の天敵！`, secret: null };
  if (oppWeak) return { outcome: "win", myScore: myCard.atk, oppScore: 0, msg: `${myCard.name}は${oppCard.name}の天敵！`, secret: null };
  if (myCard.atk > oppCard.atk) return { outcome: "win", myScore: myCard.atk - oppCard.atk, oppScore: 0, msg: `ATK勝負！${myCard.name}の勝ち`, secret: null };
  if (oppCard.atk > myCard.atk) return { outcome: "lose", myScore: 0, oppScore: oppCard.atk - myCard.atk, msg: `ATK勝負！${oppCard.name}の勝ち`, secret: null };
  return { outcome: "draw", myScore: 0, oppScore: 0, msg: "ATK同値！引き分け", secret: null };
}

// パターン背景SVG
function PatternBg({ pattern, color }) {
  const c = color[1] + "55";
  const patterns = {
    stars:    <><circle cx="10" cy="10" r="1.5" fill={c}/><circle cx="30" cy="25" r="1" fill={c}/><circle cx="20" cy="40" r="1.5" fill={c}/><circle cx="40" cy="10" r="1" fill={c}/></>,
    waves:    <><path d="M0 20 Q10 10 20 20 Q30 30 40 20 Q50 10 60 20" stroke={c} strokeWidth="2" fill="none"/><path d="M0 35 Q10 25 20 35 Q30 45 40 35" stroke={c} strokeWidth="2" fill="none"/></>,
    dots:     <><circle cx="10" cy="10" r="2" fill={c}/><circle cx="30" cy="10" r="2" fill={c}/><circle cx="10" cy="30" r="2" fill={c}/><circle cx="30" cy="30" r="2" fill={c}/><circle cx="20" cy="20" r="2" fill={c}/></>,
    grid:     <><line x1="0" y1="15" x2="50" y2="15" stroke={c} strokeWidth="1"/><line x1="0" y1="30" x2="50" y2="30" stroke={c} strokeWidth="1"/><line x1="15" y1="0" x2="15" y2="50" stroke={c} strokeWidth="1"/><line x1="30" y1="0" x2="30" y2="50" stroke={c} strokeWidth="1"/></>,
    circuit:  <><path d="M5 25 L15 25 L15 10 L30 10" stroke={c} strokeWidth="1.5" fill="none"/><path d="M30 40 L40 40 L40 25 L50 25" stroke={c} strokeWidth="1.5" fill="none"/><circle cx="30" cy="10" r="3" stroke={c} strokeWidth="1.5" fill="none"/><circle cx="30" cy="40" r="3" stroke={c} strokeWidth="1.5" fill="none"/></>,
    diamonds: <><polygon points="20,5 30,15 20,25 10,15" stroke={c} strokeWidth="1.5" fill="none"/><polygon points="30,25 40,35 30,45 20,35" stroke={c} strokeWidth="1.5" fill="none"/></>,
    flames:   <><path d="M20 45 Q10 30 20 20 Q15 30 25 25 Q20 35 30 30 Q25 40 20 45Z" stroke={c} strokeWidth="1" fill={c}/></>,
    rays:     <><line x1="25" y1="0" x2="25" y2="10" stroke={c} strokeWidth="1.5"/><line x1="25" y1="40" x2="25" y2="50" stroke={c} strokeWidth="1.5"/><line x1="0" y1="25" x2="10" y2="25" stroke={c} strokeWidth="1.5"/><line x1="40" y1="25" x2="50" y2="25" stroke={c} strokeWidth="1.5"/><line x1="5" y1="5" x2="12" y2="12" stroke={c} strokeWidth="1.5"/><line x1="38" y1="38" x2="45" y2="45" stroke={c} strokeWidth="1.5"/></>,
    wind:     <><path d="M0 20 Q15 15 25 20 Q35 25 50 20" stroke={c} strokeWidth="1.5" fill="none"/><path d="M0 30 Q15 25 25 30 Q35 35 50 30" stroke={c} strokeWidth="1.5" fill="none"/></>,
    blades:   <><line x1="10" y1="40" x2="40" y2="10" stroke={c} strokeWidth="2"/><line x1="10" y1="10" x2="40" y2="40" stroke={c} strokeWidth="2"/></>,
    gears:    <><circle cx="20" cy="20" r="8" stroke={c} strokeWidth="1.5" fill="none"/><circle cx="20" cy="20" r="3" fill={c}/><circle cx="35" cy="30" r="6" stroke={c} strokeWidth="1.5" fill="none"/></>,
  };
  return (
    <svg viewBox="0 0 50 50" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.6 }}>
      {patterns[pattern] || null}
    </svg>
  );
}

function CardIllust({ card, size = "md", fatigued }) {
  const [g1, g2] = card.color;
  const isSmall = size === "sm";
  const w = isSmall ? 72 : 100;
  const h = isSmall ? 96 : 140;
  return (
    <div style={{
      width: w, height: h, borderRadius: 8, overflow: "hidden", position: "relative", flexShrink: 0,
      background: `linear-gradient(135deg, ${g1}, ${g2})`,
      border: `2px solid ${fatigued ? "#f87171" : g1}`,
      boxShadow: fatigued ? "0 0 8px #f87171" : `0 0 12px ${g1}88`,
      filter: fatigued ? "grayscale(0.5)" : "none",
    }}>
      <PatternBg pattern={card.pattern} color={card.color} />
      {/* TYPE LABEL */}
      <div style={{ position: "absolute", top: 4, left: 4, fontSize: isSmall ? 7 : 9, fontWeight: "bold", color: "rgba(255,255,255,0.7)", letterSpacing: 1 }}>{card.label}</div>
      {/* SYMBOL */}
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: isSmall ? 28 : 42, filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))" }}>
        {fatigued ? "💤" : card.symbol}
      </div>
      {/* ATK */}
      <div style={{ position: "absolute", bottom: 4, right: 4, backgroundColor: "rgba(0,0,0,0.6)", borderRadius: 4, padding: "1px 5px", fontSize: isSmall ? 9 : 11, fontWeight: "bold", color: fatigued ? "#9ca3af" : "#fbbf24" }}>
        {fatigued ? "?" : `ATK ${card.atk}`}
      </div>
    </div>
  );
}

function CardView({ card, selected, onClick, useCount }) {
  const weakNames = card.weakness.map(wid => CARDS.find(c => c.id === wid)?.emoji).join(" ");
  const fatigued = card.fatigue && useCount >= FATIGUE_LIMIT;
  return (
    <div onClick={onClick} style={{
      cursor: "pointer", borderRadius: 10, padding: "8px 6px", textAlign: "center",
      border: `2px solid ${selected ? "#a78bfa" : fatigued ? "#f87171" : "#374151"}`,
      backgroundColor: selected ? "rgba(109,40,217,0.2)" : "#111827",
      transform: selected ? "scale(1.05)" : "scale(1)", transition: "all 0.2s",
    }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <CardIllust card={card} size="sm" fatigued={fatigued} />
      </div>
      <div style={{ fontSize: 9, fontWeight: "bold", color: fatigued ? "#f87171" : "white", lineHeight: 1.3, marginBottom: 3 }}>{card.name}</div>
      {weakNames && <div style={{ backgroundColor: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 4, padding: "1px 4px", fontSize: 9, color: "#fca5a5" }}>弱点 {weakNames}</div>}
      {fatigued && <div style={{ fontSize: 9, color: "#f87171", marginTop: 2 }}>疲労限界</div>}
    </div>
  );
}

function ResultBox({ outcome, msg, secret, myCard, oppCard, myName, oppName, myScore, oppScore, onNext, round, maxRounds }) {
  const color = outcome === "win" ? "#34d399" : outcome === "lose" ? "#f87171" : "#fbbf24";
  const icon = outcome === "win" ? "🎉" : outcome === "lose" ? "💀" : "🤝";
  const label = outcome === "win" ? "勝利！" : outcome === "lose" ? "敗北..." : "引き分け";
  return (
    <div style={{ backgroundColor: "#111827", borderRadius: 16, padding: 16, marginBottom: 12, textAlign: "center", border: `2px solid ${color}` }}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: "bold", fontSize: 18, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#9ca3af", fontSize: 13, marginBottom: 12 }}>{msg}</div>
      <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 12, alignItems: "flex-end" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{myName}</div>
          {myCard && <CardIllust card={myCard} size="md" fatigued={false} />}
          <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>+{myScore}</div>
        </div>
        <div style={{ fontSize: 18, color: "#6b7280", marginBottom: 40 }}>VS</div>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 4 }}>{oppName}</div>
          {oppCard && <CardIllust card={oppCard} size="md" fatigued={false} />}
          <div style={{ fontSize: 11, color: "#fbbf24", marginTop: 4 }}>+{oppScore}</div>
        </div>
      </div>
      {secret && <div style={{ backgroundColor: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.4)", borderRadius: 8, padding: "8px 12px", marginBottom: 8, fontSize: 12, color: "#fcd34d", textAlign: "left" }}>🔍 裏ステータス<br/>{secret}</div>}
      <button onClick={onNext} style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", backgroundColor: "#7c3aed", color: "white", fontWeight: "bold", fontSize: 15, cursor: "pointer", marginTop: 4 }}>
        {round >= maxRounds ? "🏆 最終結果へ" : `➡️ 次のラウンド (${round+1}/${maxRounds})`}
      </button>
    </div>
  );
}

function GameOver({ myName, oppName, myScore, oppScore, onHome }) {
  const won = myScore > oppScore, draw = myScore === oppScore;
  return (
    <div style={{ display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:16,backgroundColor:"#030712",color:"white",fontFamily:"sans-serif" }}>
      <div style={{ fontSize: 64, marginBottom: 8 }}>{won?"🏆":draw?"🤝":"💀"}</div>
      <div style={{ fontSize: 28, fontWeight: "bold", marginBottom: 8 }}>{won?"勝利！":draw?"引き分け":"敗北..."}</div>
      <div style={{ backgroundColor:"#111827",borderRadius:16,padding:16,marginBottom:12,width:"100%",maxWidth:320 }}>
        <div style={{ display:"flex",justifyContent:"space-between",marginBottom:8 }}><span>{myName} (YOU)</span><span style={{fontWeight:"bold",fontSize:22,color:"#fbbf24"}}>{myScore}</span></div>
        <div style={{ display:"flex",justifyContent:"space-between" }}><span>{oppName}</span><span style={{fontWeight:"bold",fontSize:22,color:"#fbbf24"}}>{oppScore}</span></div>
      </div>
      <button onClick={onHome} style={{ width:"100%",maxWidth:320,padding:14,borderRadius:12,border:"none",backgroundColor:"#7c3aed",color:"white",fontWeight:"bold",fontSize:16,cursor:"pointer" }}>ホームに戻る</button>
    </div>
  );
}

const s = {
  app: { minHeight:"100vh",backgroundColor:"#030712",color:"white",padding:16,fontFamily:"sans-serif" },
  center: { display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:16 },
  input: { width:"100%",padding:"12px 16px",borderRadius:12,border:"1px solid #374151",backgroundColor:"#111827",color:"white",fontSize:16,marginBottom:12,boxSizing:"border-box" },
  btn: (color="#7c3aed") => ({ width:"100%",padding:14,borderRadius:12,border:"none",backgroundColor:color,color:"white",fontWeight:"bold",fontSize:16,cursor:"pointer",marginBottom:8 }),
  grid: { display:"grid",gridTemplateColumns:"repeat(3, 1fr)",gap:8,marginBottom:16 },
  row: { display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 },
  badge: (color) => ({ backgroundColor:color,borderRadius:6,padding:"2px 8px",fontSize:11,fontWeight:"bold" }),
  divider: { display:"flex",alignItems:"center",gap:8,margin:"8px 0" },
  line: { flex:1,height:1,backgroundColor:"#374151" },
};

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
    setRoundResult(r); setPhase("result");
  };

  const nextRound = () => {
    if (round >= MAX_ROUNDS) { setPhase("gameover"); return; }
    setRound(r => r+1); setSelectedCard(null); setAiCard(null); setRoundResult(null); setPhase("select");
  };

  if (phase === "gameover") return <GameOver myName={playerName} oppName="🤖 AI" myScore={scores.player} oppScore={scores.ai} onHome={onHome} />;

  return (
    <div style={s.app}>
      <div style={{ maxWidth:480,margin:"0 auto" }}>
        <div style={{ ...s.row,marginBottom:16 }}>
          <div><div style={{fontWeight:"bold"}}>{playerName} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{color:"#fbbf24",fontSize:14}}>スコア: {scores.player}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#6b7280"}}>Round</div><div style={{fontWeight:"bold",fontSize:20}}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:"bold"}}>🤖 AI</div><div style={{color:"#fbbf24",fontSize:14}}>スコア: {scores.ai}</div></div>
        </div>
        {phase === "result" && roundResult && <ResultBox outcome={roundResult.outcome} msg={roundResult.msg} secret={roundResult.secret} myCard={selectedCard} oppCard={aiCard} myName={playerName} oppName="AI" myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS} />}
        {phase === "select" && (
          <>
            <div style={{fontSize:13,color:"#9ca3af",marginBottom:8}}>カードを選んで出す</div>
            <div style={s.grid}>{hand.map(card => <CardView key={card.id} card={card} selected={selectedCard?.id===card.id} onClick={()=>setSelectedCard(card)} useCount={getUseCount(card.id,myHistory)} />)}</div>
            <button style={s.btn(selectedCard?"#7c3aed":"#374151")} onClick={submitCard} disabled={!selectedCard}>
              {selectedCard?`${selectedCard.emoji} カードを出す！`:"カードを選んでください"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

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
    const unsub = onValue(ref(db,`rooms/${roomId}`),(snap)=>{
      const data=snap.val();
      if(data){setRoomData(data);if(data.status==="playing"&&screen==="waiting")setScreen("game");}
    });
    return ()=>unsub();
  },[roomId,screen]);

  const createRoom = async () => {
    const newRef=push(ref(db,"rooms")); const id=newRef.key;
    const myHand=shuffle(CARDS).slice(0,6);
    await set(newRef,{status:"waiting",p1:{name:playerName,hand:myHand,score:0,ready:false,history:[]},round:1});
    setRoomId(id);setPlayerId("p1");setHand(myHand);setScreen("waiting");
  };

  const joinRoom = async () => {
    if(!joinRoomId.trim())return;
    const myHand=shuffle(CARDS).slice(0,6);
    await set(ref(db,`rooms/${joinRoomId}/p2`),{name:playerName,hand:myHand,score:0,ready:false,history:[]});
    await set(ref(db,`rooms/${joinRoomId}/status`),"playing");
    setRoomId(joinRoomId);setPlayerId("p2");setHand(myHand);setScreen("game");
  };

  const submitCard = async () => {
    if(!selectedCard)return;
    const newHistory=[...myHistory,selectedCard.id];
    setMyHistory(newHistory);
    await set(ref(db,`rooms/${roomId}/${playerId}/selected`),selectedCard.id);
    await set(ref(db,`rooms/${roomId}/${playerId}/history`),newHistory);
    await set(ref(db,`rooms/${roomId}/${playerId}/ready`),true);
    setSelectedCard(null);
  };

  const nextRound = async () => {
    if(round>=MAX_ROUNDS){setScreen("result");return;}
    const nr=round+1;setRound(nr);
    await set(ref(db,`rooms/${roomId}/p1/ready`),false);
    await set(ref(db,`rooms/${roomId}/p2/ready`),false);
    await set(ref(db,`rooms/${roomId}/p1/selected`),null);
    await set(ref(db,`rooms/${roomId}/p2/selected`),null);
    await set(ref(db,`rooms/${roomId}/round`),nr);
  };

  const myData=roomData?.[playerId];
  const oppId=playerId==="p1"?"p2":"p1";
  const oppData=roomData?.[oppId];
  const bothReady=roomData?.p1?.ready&&roomData?.p2?.ready;

  let roundResult=null,myPlayedCard=null,oppPlayedCard=null;
  if(bothReady&&roomData?.p1?.selected&&roomData?.p2?.selected){
    const p1Card=CARDS.find(c=>c.id===roomData.p1.selected);
    const p2Card=CARDS.find(c=>c.id===roomData.p2.selected);
    if(p1Card&&p2Card){
      const myCard=playerId==="p1"?p1Card:p2Card;
      const oppCard=playerId==="p1"?p2Card:p1Card;
      const myHist=(roomData[playerId]?.history||[]).slice(0,-1);
      const oppHist=(roomData[oppId]?.history||[]).slice(0,-1);
      roundResult=calcResult(myCard,oppCard,myHist,oppHist);
      myPlayedCard=myCard;oppPlayedCard=oppCard;
    }
  }

  if(screen==="lobby") return (
    <div style={s.center}>
      <button style={{...s.btn("#374151"),width:"auto",padding:"8px 16px",marginBottom:24}} onClick={onHome}>← 戻る</button>
      <div style={{fontSize:36,marginBottom:8}}>🌐</div>
      <div style={{fontSize:28,fontWeight:"bold",marginBottom:8}}>対戦モード</div>
      <div style={{color:"#9ca3af",fontSize:14,marginBottom:16}}>{playerName} としてプレイ</div>
      <button style={s.btn()} onClick={createRoom}>🏠 ルームを作る</button>
      <div style={s.divider}><div style={s.line}/><span style={{color:"#6b7280",fontSize:14}}>または</span><div style={s.line}/></div>
      <input style={s.input} placeholder="ルームIDを入力" value={joinRoomId} onChange={e=>setJoinRoomId(e.target.value)}/>
      <button style={s.btn("#059669")} onClick={joinRoom}>🚪 ルームに参加</button>
    </div>
  );

  if(screen==="waiting") return (
    <div style={s.center}>
      <div style={{fontSize:48,marginBottom:16}}>⏳</div>
      <div style={{fontSize:28,fontWeight:"bold",marginBottom:8}}>待機中...</div>
      <div style={{color:"#9ca3af",fontSize:14,marginBottom:16}}>このIDを友達に送ってください</div>
      <div style={{backgroundColor:"#111827",borderRadius:16,padding:16,width:"100%",maxWidth:320,textAlign:"center"}}>
        <div style={{fontSize:12,color:"#9ca3af",marginBottom:4}}>ルームID</div>
        <div style={{fontSize:14,fontWeight:"bold",wordBreak:"break-all"}}>{roomId}</div>
      </div>
    </div>
  );

  if(screen==="result") return <GameOver myName={myData?.name} oppName={oppData?.name} myScore={myData?.score??0} oppScore={oppData?.score??0} onHome={onHome}/>;

  return (
    <div style={s.app}>
      <div style={{maxWidth:480,margin:"0 auto"}}>
        <div style={{...s.row,marginBottom:16}}>
          <div><div style={{fontWeight:"bold"}}>{myData?.name} <span style={s.badge("#7c3aed")}>YOU</span></div><div style={{color:"#fbbf24",fontSize:14}}>スコア: {myData?.score??0}</div></div>
          <div style={{textAlign:"center"}}><div style={{fontSize:11,color:"#6b7280"}}>Round</div><div style={{fontWeight:"bold",fontSize:20}}>{round}/{MAX_ROUNDS}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontWeight:"bold"}}>{oppData?.name??"?"}</div><div style={{color:"#fbbf24",fontSize:14}}>スコア: {oppData?.score??0}</div></div>
        </div>
        {bothReady&&roundResult&&<ResultBox outcome={roundResult.outcome} msg={roundResult.msg} secret={roundResult.secret} myCard={myPlayedCard} oppCard={oppPlayedCard} myName={myData?.name} oppName={oppData?.name} myScore={roundResult.myScore} oppScore={roundResult.oppScore} onNext={nextRound} round={round} maxRounds={MAX_ROUNDS}/>}
        {!myData?.ready&&(
          <>
            <div style={{fontSize:13,color:"#9ca3af",marginBottom:8}}>カードを選んで出す</div>
            <div style={s.grid}>{hand.map(card=><CardView key={card.id} card={card} selected={selectedCard?.id===card.id} onClick={()=>setSelectedCard(card)} useCount={getUseCount(card.id,myHistory)}/>)}</div>
            <button style={s.btn(selectedCard?"#7c3aed":"#374151")} onClick={submitCard} disabled={!selectedCard}>
              {selectedCard?`${selectedCard.emoji} カードを出す！`:"カードを選んでください"}
            </button>
          </>
        )}
        {myData?.ready&&!bothReady&&(
          <div style={{textAlign:"center",padding:"32px 0"}}>
            <div style={{fontSize:36,marginBottom:8}}>⏳</div>
            <div style={{color:"#9ca3af"}}>相手のカードを待っています...</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [mode, setMode] = useState("home");
  const [playerName, setPlayerName] = useState("");
  const [nameEntered, setNameEntered] = useState(false);

  if(mode==="solo") return <SoloGame playerName={playerName} onHome={()=>setMode("home")}/>;
  if(mode==="multi") return <MultiGame playerName={playerName} onHome={()=>setMode("home")}/>;

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",minHeight:"100vh",padding:16,backgroundColor:"#030712",color:"white",fontFamily:"sans-serif"}}>
      <div style={{fontSize:48,marginBottom:8}}>⚔️</div>
      <div style={{fontSize:28,fontWeight:"bold",marginBottom:8}}>カードバトル</div>
      <div style={{color:"#9ca3af",fontSize:14,marginBottom:24}}>天敵＆疲労システム搭載</div>
      {!nameEntered?(
        <>
          <input style={s.input} placeholder="あなたの名前を入力" value={playerName} onChange={e=>setPlayerName(e.target.value)}/>
          <button style={s.btn(playerName.trim()?"#7c3aed":"#374151")} onClick={()=>{if(playerName.trim())setNameEntered(true);}} disabled={!playerName.trim()}>決定</button>
        </>
      ):(
        <>
          <div style={{color:"#9ca3af",fontSize:14,marginBottom:16}}>ようこそ、{playerName}さん！</div>
          <button style={s.btn("#059669")} onClick={()=>setMode("solo")}>🤖 AIと対戦（1人モード）</button>
          <button style={s.btn()} onClick={()=>setMode("multi")}>🌐 友達と対戦（2人モード）</button>
          <button style={{...s.btn("#374151"),marginTop:4}} onClick={()=>{setNameEntered(false);setPlayerName("");}}>← 名前を変える</button>
        </>
      )}
    </div>
  );
}
