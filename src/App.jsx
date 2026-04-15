import { useState, useEffect, useRef, useCallback } from "react";

const GRID = 15;
const SPEED_INIT = 140;
const SPEED_MIN = 70;
const ROUND_TIME = 90;
const FOOD_SCORE = 10;
const TITLE = "Kaist Snake Game Of Ts";

const C = {
  bg: "#060610",
  panel: "#0c0c1a",
  border: "#1a1a30",
  p1: "#4AAFE0",
  p1Light: "#6CC8F5",
  p1Dark: "#2E7BB8",
  p2: "#E83565",
  p2Light: "#FF5A85",
  p2Dark: "#B82050",
  p2Orange: "#FF6B35",
  food: "#ffd700",
  foodGlow: "#ffaa00",
  text: "#c8c8d8",
  dim: "#555575",
  accent: "#4A90D9",
  white: "#eeeef6",
  danger: "#ff3333",
  success: "#44ff88",
  heart: "#FF1493",
  beak: "#FFB030",
};

const genCode = () => {
  const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => c[Math.floor(Math.random() * c.length)]).join("");
};

const initPlayer = (pNum) => {
  const y = Math.floor(GRID / 2);
  const x = pNum === 1 ? 3 : GRID - 4;
  const dir = pNum === 1 ? { x: 1, y: 0 } : { x: -1, y: 0 };
  return {
    snake: [{ x, y }, { x: x - dir.x, y }, { x: x - 2 * dir.x, y }],
    dir: { ...dir },
    nextDir: { ...dir },
    food: null,
    score: 0,
    alive: true,
    eaten: 0,
  };
};

const spawnFood = (snake) => {
  const occupied = new Set(snake.map((s) => `${s.x},${s.y}`));
  const free = [];
  for (let x = 0; x < GRID; x++)
    for (let y = 0; y < GRID; y++)
      if (!occupied.has(`${x},${y}`)) free.push({ x, y });
  return free.length > 0 ? free[Math.floor(Math.random() * free.length)] : null;
};

const tickPlayer = (p) => {
  if (!p.alive) return p;
  const np = { ...p, dir: { ...p.nextDir } };
  const head = p.snake[0];
  const nh = { x: head.x + np.dir.x, y: head.y + np.dir.y };
  if (nh.x < 0 || nh.x >= GRID || nh.y < 0 || nh.y >= GRID) return { ...p, alive: false };
  if (p.snake.some((s) => s.x === nh.x && s.y === nh.y)) return { ...p, alive: false };
  const ns = [nh, ...p.snake];
  if (p.food && nh.x === p.food.x && nh.y === p.food.y) {
    np.score = p.score + FOOD_SCORE;
    np.eaten = p.eaten + 1;
    np.food = spawnFood(ns);
  } else {
    ns.pop();
  }
  np.snake = ns;
  return np;
};

const setDir = (p, dx, dy) => {
  if (p.dir.x === -dx && p.dir.y === -dy) return p;
  if (dx === 0 && dy === 0) return p;
  return { ...p, nextDir: { x: dx, y: dy } };
};

const getSpeed = (eaten) => Math.max(SPEED_MIN, SPEED_INIT - eaten * 4);

const roundRect = (ctx, x, y, w, h, r) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

/* ─── 넙죽이 Head ─── */
const drawNeopjuki = (ctx, cx, cy, size) => {
  const s = size;
  ctx.save();
  ctx.fillStyle = C.p1;
  ctx.beginPath();
  ctx.ellipse(cx, cy - s * 0.05, s * 0.48, s * 0.38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = s * 0.06;
  ctx.stroke();

  const eyeR = s * 0.11;
  const pupilR = s * 0.06;
  const eyeY = cy - s * 0.08;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx - s * 0.14, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(cx - s * 0.12, eyeY + s * 0.01, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + s * 0.14, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(cx + s * 0.16, eyeY + s * 0.01, pupilR, 0, Math.PI * 2); ctx.fill();

  const hx = cx - s * 0.42, hy = cy - s * 0.18, hs = s * 0.08;
  ctx.fillStyle = C.heart;
  ctx.beginPath();
  ctx.moveTo(hx, hy + hs * 0.3);
  ctx.bezierCurveTo(hx, hy, hx - hs, hy, hx - hs, hy + hs * 0.3);
  ctx.bezierCurveTo(hx - hs, hy + hs * 0.7, hx, hy + hs, hx, hy + hs * 1.2);
  ctx.bezierCurveTo(hx, hy + hs, hx + hs, hy + hs * 0.7, hx + hs, hy + hs * 0.3);
  ctx.bezierCurveTo(hx + hs, hy, hx, hy, hx, hy + hs * 0.3);
  ctx.fill();
  ctx.restore();
};

/* ─── 포닉스 Head ─── */
const drawPhoenix = (ctx, cx, cy, size) => {
  const s = size;
  ctx.save();
  const flameGrad = ctx.createLinearGradient(cx - s * 0.3, cy - s * 0.5, cx + s * 0.3, cy - s * 0.1);
  flameGrad.addColorStop(0, "#FF6B35");
  flameGrad.addColorStop(0.5, "#E83565");
  flameGrad.addColorStop(1, "#C41E50");
  ctx.fillStyle = flameGrad;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.2, cy - s * 0.15);
  ctx.quadraticCurveTo(cx - s * 0.35, cy - s * 0.55, cx - s * 0.05, cy - s * 0.45);
  ctx.quadraticCurveTo(cx - s * 0.15, cy - s * 0.65, cx + s * 0.08, cy - s * 0.5);
  ctx.quadraticCurveTo(cx + s * 0.05, cy - s * 0.7, cx + s * 0.25, cy - s * 0.45);
  ctx.quadraticCurveTo(cx + s * 0.38, cy - s * 0.35, cx + s * 0.3, cy - s * 0.15);
  ctx.closePath();
  ctx.fill();

  const headGrad = ctx.createRadialGradient(cx - s * 0.05, cy - s * 0.05, 0, cx, cy, s * 0.38);
  headGrad.addColorStop(0, "#FF4577");
  headGrad.addColorStop(1, "#C41E50");
  ctx.fillStyle = headGrad;
  ctx.beginPath(); ctx.arc(cx, cy + s * 0.02, s * 0.35, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#1a1a2a";
  ctx.lineWidth = s * 0.05;
  ctx.stroke();

  ctx.strokeStyle = "#2a1015";
  ctx.lineWidth = s * 0.04;
  ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(cx - s * 0.24, cy - s * 0.15); ctx.lineTo(cx - s * 0.1, cy - s * 0.08); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx + s * 0.24, cy - s * 0.15); ctx.lineTo(cx + s * 0.1, cy - s * 0.08); ctx.stroke();

  const eyeR = s * 0.09, pupilR = s * 0.05, eyeY = cy;
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx - s * 0.14, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a1020";
  ctx.beginPath(); ctx.arc(cx - s * 0.13, eyeY + s * 0.01, pupilR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.beginPath(); ctx.arc(cx + s * 0.14, eyeY, eyeR, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#3a1020";
  ctx.beginPath(); ctx.arc(cx + s * 0.15, eyeY + s * 0.01, pupilR, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = C.beak;
  ctx.beginPath();
  ctx.moveTo(cx - s * 0.06, cy + s * 0.1);
  ctx.quadraticCurveTo(cx, cy + s * 0.2, cx + s * 0.06, cy + s * 0.1);
  ctx.quadraticCurveTo(cx, cy + s * 0.14, cx - s * 0.06, cy + s * 0.1);
  ctx.fill();
  ctx.restore();
};

/* ─── Board Drawing ─── */
const drawBoard = (ctx, p, playerNum, size, animFrame) => {
  const cell = size / GRID;
  const isP1 = playerNum === 1;
  const mainColor = isP1 ? C.p1 : C.p2;
  const lightColor = isP1 ? C.p1Light : C.p2Light;
  const darkColor = isP1 ? C.p1Dark : C.p2Dark;

  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#060610";
  ctx.fillRect(0, 0, size, size);

  // Grid lines
  ctx.strokeStyle = `rgba(${isP1 ? "74,175,224" : "232,53,101"},0.07)`;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= GRID; i++) {
    ctx.beginPath(); ctx.moveTo(i * cell, 0); ctx.lineTo(i * cell, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * cell); ctx.lineTo(size, i * cell); ctx.stroke();
  }

  // Wall border - single bright line
  ctx.save();
  ctx.strokeStyle = mainColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, size - 3, size - 3);
  ctx.restore();

  if (p.food) {
    const pulse = 1 + Math.sin(animFrame * 0.15) * 0.15;
    const fx = p.food.x * cell + cell / 2;
    const fy = p.food.y * cell + cell / 2;
    const fr = cell * 0.3 * pulse;
    ctx.save();
    ctx.shadowBlur = 16;
    ctx.shadowColor = C.food;
    ctx.fillStyle = C.food;
    ctx.beginPath(); ctx.arc(fx, fy, fr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff8";
    ctx.beginPath(); ctx.arc(fx - fr * 0.2, fy - fr * 0.2, fr * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  for (let i = p.snake.length - 1; i >= 1; i--) {
    const seg = p.snake[i];
    const t = 1 - (i / Math.max(p.snake.length, 1)) * 0.55;
    const segSize = cell * (0.7 + t * 0.2);
    const offset = (cell - segSize) / 2;
    ctx.save();
    ctx.shadowBlur = 4 + t * 6;
    ctx.shadowColor = `${mainColor}66`;
    const grd = ctx.createRadialGradient(seg.x * cell + cell / 2, seg.y * cell + cell / 2, 0, seg.x * cell + cell / 2, seg.y * cell + cell / 2, segSize / 2);
    grd.addColorStop(0, lightColor);
    grd.addColorStop(1, darkColor);
    ctx.fillStyle = grd;
    roundRect(ctx, seg.x * cell + offset, seg.y * cell + offset, segSize, segSize, segSize * 0.3);
    ctx.fill();
    ctx.restore();
  }

  if (p.snake.length > 0) {
    const head = p.snake[0];
    const hx = head.x * cell + cell / 2;
    const hy = head.y * cell + cell / 2;
    const headSize = cell * 1.4;
    ctx.save();
    ctx.shadowBlur = 18;
    ctx.shadowColor = mainColor;
    if (isP1) drawNeopjuki(ctx, hx, hy, headSize);
    else drawPhoenix(ctx, hx, hy, headSize);
    ctx.restore();
  }

  if (!p.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, size, size);
    ctx.save();
    ctx.shadowBlur = 20;
    ctx.shadowColor = C.danger;
    ctx.fillStyle = C.danger;
    ctx.font = `bold ${Math.round(size * 0.065)}px 'Courier New', monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GAME OVER", size / 2, size / 2 - size * 0.03);
    ctx.font = `${Math.round(size * 0.04)}px 'Courier New', monospace`;
    ctx.fillStyle = "#ff666688";
    ctx.fillText(`SCORE: ${p.score}`, size / 2, size / 2 + size * 0.06);
    ctx.restore();
  }
};

/* ─── Button ─── */
const Btn = ({ children, onClick, color = C.accent, disabled, small, style: sx }) => (
  <button onClick={onClick} disabled={disabled} style={{
    background: disabled ? "#1a1a22" : `${color}18`,
    color: disabled ? "#444" : color,
    border: `1.5px solid ${disabled ? "#2a2a35" : `${color}55`}`,
    borderRadius: 10, padding: small ? "7px 16px" : "11px 24px",
    fontSize: small ? 12 : 14, fontFamily: "'Courier New', monospace",
    fontWeight: 700, cursor: disabled ? "default" : "pointer",
    letterSpacing: 1.2, transition: "all 0.2s", textTransform: "uppercase",
    boxShadow: disabled ? "none" : `0 0 16px ${color}22`,
    opacity: disabled ? 0.5 : 1, ...sx,
  }}>{children}</button>
);

/* ─── Title ─── */
const TitleDisplay = ({ size = "large" }) => {
  const fs = size === "large" ? 26 : 14;
  const words = TITLE.split(" ");
  const colors = [C.p1, C.p1Light, C.white, C.white, C.p2, C.p2Light];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: size === "large" ? 8 : 4 }}>
      {words.map((w, i) => (
        <span key={i} style={{
          fontSize: fs, fontWeight: 900, letterSpacing: size === "large" ? 2 : 1,
          color: colors[i % colors.length],
          textShadow: `0 0 12px ${colors[i % colors.length]}44`,
          fontFamily: "'Courier New', monospace",
        }}>{w}</span>
      ))}
    </div>
  );
};

/* ─── PeerJS Loader ─── */
const loadPeerJS = () => new Promise((resolve, reject) => {
  if (window.Peer) return resolve(window.Peer);
  const s = document.createElement("script");
  s.src = "https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.4/peerjs.min.js";
  s.onload = () => resolve(window.Peer);
  s.onerror = () => reject(new Error("PeerJS load failed"));
  document.head.appendChild(s);
});

/* ═══════════════════════════════════════════ */
export default function SnakeArena() {
  const [phase, setPhase] = useState("lobby");
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [peerConnected, setPeerConnected] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [timer, setTimer] = useState(ROUND_TIME);
  const [scores, setScores] = useState([0, 0]);
  const [alive, setAlive] = useState([true, true]);
  const [boardSize, setBoardSize] = useState(280);
  const [copied, setCopied] = useState(false);
  const [connType, setConnType] = useState(null); // 'peer' | 'broadcast' | null
  const [connStatus, setConnStatus] = useState("");

  const c1 = useRef(null);
  const c2 = useRef(null);
  const game = useRef({ p1: null, p2: null });
  const loopRef = useRef(null);
  const timerRef = useRef(null);
  const channelRef = useRef(null);   // BroadcastChannel fallback
  const peerRef = useRef(null);      // PeerJS Peer instance
  const connRef = useRef(null);      // PeerJS DataConnection
  const phaseRef = useRef(phase);
  const modeRef = useRef(mode);
  const touchStartRef = useRef(null);
  const animRef = useRef(0);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const raw = Math.min(Math.max(Math.floor((w - 36) / 2), 150), h - 160);
      setBoardSize(Math.floor(raw / GRID) * GRID);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const draw = useCallback(() => {
    animRef.current++;
    if (c1.current && game.current.p1) drawBoard(c1.current.getContext("2d"), game.current.p1, 1, boardSize, animRef.current);
    if (c2.current && game.current.p2) drawBoard(c2.current.getContext("2d"), game.current.p2, 2, boardSize, animRef.current);
  }, [boardSize]);

  const sendMsg = useCallback((type, data) => {
    const msg = { type, data };
    try {
      if (connRef.current && connRef.current.open) connRef.current.send(msg);
      else if (channelRef.current) channelRef.current.postMessage(msg);
    } catch (e) {}
  }, []);

  const onData = useCallback((msg) => {
    const { type, data } = msg.type ? msg : (msg.data || msg);
    if (type === "join" && modeRef.current === "host") { setPeerConnected(true); sendMsg("welcome", {}); }
    if (type === "welcome" && modeRef.current === "guest") setPeerConnected(true);
    if (type === "start") beginGame();
    if (type === "state" && phaseRef.current === "playing") {
      const key = modeRef.current === "host" ? "p2" : "p1";
      if (game.current[key]) {
        game.current[key] = { ...game.current[key], ...data };
        setScores([game.current.p1.score, game.current.p2.score]);
        setAlive([game.current.p1.alive, game.current.p2.alive]);
      }
    }
    if (type === "dir" && phaseRef.current === "playing") {
      const key = modeRef.current === "host" ? "p2" : "p1";
      if (game.current[key]) game.current[key] = setDir(game.current[key], data.dx, data.dy);
    }
  }, [sendMsg]);

  const setupPeerConn = useCallback((conn) => {
    connRef.current = conn;
    conn.on("open", () => { setPeerConnected(true); sendMsg("welcome", {}); });
    conn.on("data", (msg) => onData(msg));
    conn.on("close", () => setPeerConnected(false));
  }, [onData, sendMsg]);

  const fallbackToBroadcast = useCallback((code, isHost) => {
    setConnType("broadcast");
    setConnStatus("같은 브라우저 전용 (로컬)");
    const ch = new BroadcastChannel(`snake-${code}`);
    ch.onmessage = (e) => onData(e.data);
    channelRef.current = ch;
    if (!isHost) setTimeout(() => ch.postMessage({ type: "join", data: {} }), 100);
  }, [onData]);

  const createRoom = async () => {
    const code = genCode();
    setRoomCode(code); setMode("host"); setPhase("waiting");
    setConnStatus("연결 준비 중...");
    try {
      const PeerClass = await loadPeerJS();
      const peer = new PeerClass(`kaistsnake${code}`, { debug: 0 });
      peerRef.current = peer;
      peer.on("open", () => {
        setConnType("peer");
        setConnStatus("다른 기기 접속 가능 (온라인)");
      });
      peer.on("connection", (conn) => setupPeerConn(conn));
      peer.on("error", () => fallbackToBroadcast(code, true));
    } catch {
      fallbackToBroadcast(code, true);
    }
  };

  const joinRoom = async () => {
    if (joinCode.length < 4) return;
    const code = joinCode.toUpperCase();
    setRoomCode(code); setMode("guest"); setPhase("waiting");
    setConnStatus("연결 중...");
    try {
      const PeerClass = await loadPeerJS();
      const peer = new PeerClass(undefined, { debug: 0 });
      peerRef.current = peer;
      peer.on("open", () => {
        setConnType("peer");
        const conn = peer.connect(`kaistsnake${code}`, { reliable: true });
        connRef.current = conn;
        conn.on("open", () => {
          setPeerConnected(true);
          setConnStatus("연결됨 (온라인)");
          conn.send({ type: "join", data: {} });
        });
        conn.on("data", (msg) => onData(msg));
        conn.on("close", () => { setPeerConnected(false); setConnStatus("연결 끊김"); });
      });
      peer.on("error", () => fallbackToBroadcast(code, false));
    } catch {
      fallbackToBroadcast(code, false);
    }
  };

  const startLocal = () => { setMode("local"); setPhase("waiting"); setPeerConnected(true); setConnType("local"); };
  const copyCode = async () => { try { await navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { setCopied(false); } };

  const beginGame = useCallback(() => {
    game.current.p1 = initPlayer(1); game.current.p2 = initPlayer(2);
    game.current.p1.food = spawnFood(game.current.p1.snake);
    game.current.p2.food = spawnFood(game.current.p2.snake);
    setScores([0, 0]); setAlive([true, true]); setTimer(ROUND_TIME); setCountdown(3); setPhase("countdown");
    let c = 3;
    const ci = setInterval(() => { c--; if (c <= 0) { clearInterval(ci); setPhase("playing"); startLoop(); startTimer(); } else setCountdown(c); }, 800);
  }, []);

  const handleStartGame = () => {
    if (mode === "host" || mode === "local") { beginGame(); if (mode === "host") sendMsg("start", {}); }
  };

  const startLoop = useCallback(() => {
    if (loopRef.current) clearInterval(loopRef.current);
    let currentSpeed = SPEED_INIT;
    const doTick = () => {
      if (phaseRef.current !== "playing") return;
      const g = game.current;
      if (modeRef.current === "local") { g.p1 = tickPlayer(g.p1); g.p2 = tickPlayer(g.p2); }
      else if (modeRef.current === "host") { g.p1 = tickPlayer(g.p1); sendMsg("state", { snake: g.p1.snake, score: g.p1.score, alive: g.p1.alive, food: g.p1.food, eaten: g.p1.eaten }); }
      else { g.p2 = tickPlayer(g.p2); sendMsg("state", { snake: g.p2.snake, score: g.p2.score, alive: g.p2.alive, food: g.p2.food, eaten: g.p2.eaten }); }
      setScores([g.p1.score, g.p2.score]); setAlive([g.p1.alive, g.p2.alive]); draw();
      if (!g.p1.alive && !g.p2.alive) { endGame(); return; }
      const newSpeed = getSpeed(Math.max(g.p1.eaten, g.p2.eaten));
      if (newSpeed !== currentSpeed) { currentSpeed = newSpeed; clearInterval(loopRef.current); loopRef.current = setInterval(doTick, newSpeed); }
    };
    loopRef.current = setInterval(doTick, currentSpeed);
  }, [draw, sendMsg]);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    let t = ROUND_TIME; setTimer(t);
    timerRef.current = setInterval(() => { t--; setTimer(t); if (t <= 0) endGame(); }, 1000);
  }, []);

  const endGame = useCallback(() => {
    setPhase("gameover");
    if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; }
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    draw();
  }, [draw]);

  const togglePause = () => {
    if (phase === "playing") { setPhase("paused"); if (loopRef.current) { clearInterval(loopRef.current); loopRef.current = null; } if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } }
    else if (phase === "paused") { setPhase("playing"); startLoop(); startTimer(); }
  };

  const restartGame = () => { if (loopRef.current) clearInterval(loopRef.current); if (timerRef.current) clearInterval(timerRef.current); handleStartGame(); };

  const destroyConnection = () => {
    if (connRef.current) { try { connRef.current.close(); } catch {} connRef.current = null; }
    if (peerRef.current) { try { peerRef.current.destroy(); } catch {} peerRef.current = null; }
    if (channelRef.current) { try { channelRef.current.close(); } catch {} channelRef.current = null; }
  };

  const backToLobby = () => {
    if (loopRef.current) clearInterval(loopRef.current); if (timerRef.current) clearInterval(timerRef.current);
    destroyConnection();
    setPhase("lobby"); setMode(null); setRoomCode(""); setJoinCode(""); setPeerConnected(false);
    setConnType(null); setConnStatus("");
    game.current = { p1: null, p2: null };
  };

  useEffect(() => {
    const onKey = (e) => {
      if (phaseRef.current !== "playing") return;
      const g = game.current;
      const m = modeRef.current;
      if (m === "local" || m === "host") {
        if (e.key === "w" || e.key === "W") g.p1 = setDir(g.p1, 0, -1);
        if (e.key === "s" || e.key === "S") g.p1 = setDir(g.p1, 0, 1);
        if (e.key === "a" || e.key === "A") g.p1 = setDir(g.p1, -1, 0);
        if (e.key === "d" || e.key === "D") g.p1 = setDir(g.p1, 1, 0);
      }
      if (m === "local") {
        if (e.key === "ArrowUp") { e.preventDefault(); g.p2 = setDir(g.p2, 0, -1); }
        if (e.key === "ArrowDown") { e.preventDefault(); g.p2 = setDir(g.p2, 0, 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); g.p2 = setDir(g.p2, -1, 0); }
        if (e.key === "ArrowRight") { e.preventDefault(); g.p2 = setDir(g.p2, 1, 0); }
      }
      if (m === "host") {
        if (e.key === "ArrowUp") { e.preventDefault(); g.p1 = setDir(g.p1, 0, -1); }
        if (e.key === "ArrowDown") { e.preventDefault(); g.p1 = setDir(g.p1, 0, 1); }
        if (e.key === "ArrowLeft") { e.preventDefault(); g.p1 = setDir(g.p1, -1, 0); }
        if (e.key === "ArrowRight") { e.preventDefault(); g.p1 = setDir(g.p1, 1, 0); }
      }
      if (m === "guest") {
        let dx = 0, dy = 0;
        if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") dy = -1;
        if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") dy = 1;
        if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") dx = -1;
        if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") dx = 1;
        if (dx || dy) { e.preventDefault(); g.p2 = setDir(g.p2, dx, dy); sendMsg("dir", { dx, dy }); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleTouchStart = (e, player) => { touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, player }; };
  const handleTouchEnd = (e) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0]; const dx = t.clientX - touchStartRef.current.x; const dy = t.clientY - touchStartRef.current.y;
    const p = touchStartRef.current.player;
    if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
    let dirX = 0, dirY = 0;
    if (Math.abs(dx) > Math.abs(dy)) dirX = dx > 0 ? 1 : -1; else dirY = dy > 0 ? 1 : -1;
    const key = p === 1 ? "p1" : "p2";
    if (game.current[key]) { game.current[key] = setDir(game.current[key], dirX, dirY); if (modeRef.current === "guest" && p === 2) sendMsg("dir", { dx: dirX, dy: dirY }); }
    touchStartRef.current = null;
  };

  useEffect(() => {
    if (["countdown", "playing", "paused", "gameover"].includes(phase)) draw();
    if (phase === "countdown") {
      [c1, c2].forEach((ref, i) => {
        if (!ref.current) return;
        const ctx = ref.current.getContext("2d");
        const s = boardSize;
        ctx.save();
        ctx.fillStyle = "rgba(6,6,16,0.45)";
        ctx.fillRect(0, 0, s, s);
        const color = i === 0 ? C.p1 : C.p2;
        ctx.font = `bold ${Math.round(s * 0.38)}px 'Courier New', monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.shadowBlur = 40;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fillText(countdown, s / 2, s / 2);
        ctx.restore();
      });
    }
  }, [phase, boardSize, draw, countdown]);
  useEffect(() => { return () => { if (loopRef.current) clearInterval(loopRef.current); if (timerRef.current) clearInterval(timerRef.current); destroyConnection(); }; }, []);

  const winner = scores[0] > scores[1] ? 1 : scores[1] > scores[0] ? 2 : 0;

  const S = {
    page: { minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Courier New', monospace", display: "flex", flexDirection: "column", alignItems: "center", overflow: "hidden", position: "relative" },
    header: { width: "100%", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${C.border}`, background: `linear-gradient(180deg, ${C.panel}ee, ${C.panel}88)`, backdropFilter: "blur(8px)", zIndex: 10 },
    center: { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flex: 1, gap: 20, padding: 24, textAlign: "center" },
    box: { background: `linear-gradient(145deg, ${C.panel}, #0a0a18)`, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, maxWidth: 420, width: "92%", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" },
    input: { background: "#0c0c18", border: `1.5px solid ${C.border}`, borderRadius: 10, padding: "11px 14px", color: C.white, fontFamily: "monospace", fontSize: 16, letterSpacing: 5, textAlign: "center", width: "100%", outline: "none", textTransform: "uppercase" },
    divider: { display: "flex", alignItems: "center", gap: 12, width: "100%", margin: "14px 0", color: C.dim, fontSize: 11, letterSpacing: 2 },
    line: { flex: 1, height: 1, background: C.border },
    tag: (color) => ({ display: "inline-block", padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${color}1a`, color, border: `1px solid ${color}33`, letterSpacing: 1 }),
    overlay: { position: "fixed", inset: 0, background: "rgba(4,4,10,0.88)", backdropFilter: "blur(8px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 100, gap: 16 },
  };

  /* ═══ LOBBY ═══ */
  if (phase === "lobby") {
    return (
      <div style={S.page}>
        <style>{`
          @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
          input:focus { border-color: ${C.accent} !important; box-shadow: 0 0 14px ${C.accent}33; }
        `}</style>
        <div style={S.center}>
          <div style={{ display: "flex", gap: 32, marginBottom: 8, alignItems: "center" }}>
            <canvas ref={(el) => { if (el) { const ctx = el.getContext("2d"); ctx.clearRect(0,0,70,70); drawNeopjuki(ctx, 35, 35, 60); } }} width={70} height={70} style={{ animation: "float 3s ease-in-out infinite" }} />
            <span style={{ fontSize: 22, color: C.dim, fontWeight: 900 }}>VS</span>
            <canvas ref={(el) => { if (el) { const ctx = el.getContext("2d"); ctx.clearRect(0,0,70,70); drawPhoenix(ctx, 35, 38, 60); } }} width={70} height={70} style={{ animation: "float 3s ease-in-out infinite 0.5s" }} />
          </div>
          <TitleDisplay size="large" />
          <div style={{ fontSize: 11, letterSpacing: 5, color: C.dim, marginBottom: 24, fontWeight: 600 }}>넙죽이 VS 포닉스</div>

          <div style={S.box}>
            <div style={{ marginBottom: 18 }}>
              <Btn onClick={startLocal} color={C.p1} style={{ width: "100%", padding: "14px 0", fontSize: 15 }}>⚡ 로컬 대전</Btn>
              <div style={{ fontSize: 10, color: C.dim, marginTop: 6 }}>넙죽이: WASD &nbsp;|&nbsp; 포닉스: 방향키</div>
            </div>
            <div style={S.divider}><div style={S.line} /><span>ONLINE</span><div style={S.line} /></div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Btn onClick={createRoom} color={C.accent} style={{ width: "100%" }}>🏠 방 만들기</Btn>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input style={S.input} value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase().slice(0, 6))} placeholder="방 코드" maxLength={6} />
                <Btn onClick={joinRoom} color={C.p2} disabled={joinCode.length < 4}>참가</Btn>
              </div>
              <div style={{ fontSize: 10, color: C.dim }}>다른 기기에서도 접속 가능 (같은 코드 입력)</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.dim, marginTop: 20, lineHeight: 2, maxWidth: 380 }}>🎮 각자의 보드에서 경쟁 &nbsp; 🍎 먹이 = 점수 + 속도↑ &nbsp; ⏱ {ROUND_TIME}초 제한</div>
        </div>
      </div>
    );
  }

  /* ═══ WAITING ═══ */
  if (phase === "waiting") {
    return (
      <div style={S.page}>
        <style>{`@keyframes pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.02);opacity:0.8} }`}</style>
        <div style={S.header}><TitleDisplay size="small" /><Btn onClick={backToLobby} color={C.dim} small>← 나가기</Btn></div>
        <div style={S.center}>
          <div style={S.box}>
            {mode === "host" && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, color: C.dim, marginBottom: 8, letterSpacing: 2 }}>방 코드</div>
                <div style={{ fontSize: 34, fontWeight: 900, letterSpacing: 8, color: C.accent, textShadow: `0 0 24px ${C.accent}44`, marginBottom: 10 }}>{roomCode}</div>
                <Btn onClick={copyCode} color={C.accent} small>{copied ? "✓ 복사됨!" : "📋 코드 복사"}</Btn>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "center", gap: 32, margin: "22px 0" }}>
              <div style={{ textAlign: "center" }}>
                <canvas ref={(el) => { if (el) { const ctx = el.getContext("2d"); ctx.clearRect(0,0,50,50); drawNeopjuki(ctx, 25, 25, 42); } }} width={50} height={50} />
                <div style={S.tag(C.p1)}>넙죽이</div>
                <div style={{ fontSize: 18, marginTop: 6 }}>✅</div>
              </div>
              <div style={{ textAlign: "center" }}>
                <canvas ref={(el) => { if (el) { const ctx = el.getContext("2d"); ctx.clearRect(0,0,50,50); drawPhoenix(ctx, 25, 28, 42); } }} width={50} height={50} />
                <div style={S.tag(C.p2)}>포닉스</div>
                <div style={{ fontSize: 18, marginTop: 6, animation: peerConnected ? "none" : "pulse 1.5s infinite" }}>{peerConnected ? "✅" : "⏳"}</div>
              </div>
            </div>
            <Btn onClick={handleStartGame} color={C.success} disabled={!peerConnected} style={{ width: "100%", padding: "14px 0", fontSize: 16 }}>
              {peerConnected ? "🚀 게임 시작" : "상대방 대기 중..."}
            </Btn>
            {connStatus && <div style={{ marginTop: 10, fontSize: 10, color: connType === "peer" ? C.success : C.food, letterSpacing: 1, padding: "4px 10px", borderRadius: 6, background: connType === "peer" ? `${C.success}12` : `${C.food}12`, border: `1px solid ${connType === "peer" ? `${C.success}33` : `${C.food}33`}`, display: "inline-block" }}>
              {connType === "peer" ? "🌐" : "📡"} {connStatus}
            </div>}
            {mode === "guest" && <div style={{ marginTop: 12, color: peerConnected ? C.success : C.dim, fontSize: 12 }}>{peerConnected ? "✅ 연결됨! 호스트가 시작합니다." : "⏳ 호스트에 연결 중..."}</div>}
          </div>
        </div>
      </div>
    );
  }

  /* ═══ GAME ═══ */
  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.1)} }
        @keyframes fadeIn { from{opacity:0;transform:scale(0.92)} to{opacity:1;transform:scale(1)} }
      `}</style>

      <div style={S.header}>
        <TitleDisplay size="small" />
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {roomCode && <span style={S.tag(C.accent)}>#{roomCode}</span>}
          <span style={S.tag(mode === "local" ? C.p1 : connType === "peer" ? C.success : C.accent)}>{mode === "local" ? "로컬" : connType === "peer" ? "🌐 온라인" : mode === "host" ? "호스트" : "게스트"}</span>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "center", gap: 28, padding: "4px 0", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: C.p1, fontWeight: 800, letterSpacing: 2 }}>넙죽이</span>
          <span style={{ fontSize: 26, fontWeight: 900, color: C.p1, textShadow: `0 0 14px ${C.p1}55`, fontVariantNumeric: "tabular-nums" }}>{scores[0]}</span>
        </div>
        <div style={{ fontSize: 17, fontWeight: 800, color: timer <= 10 ? C.danger : C.white, minWidth: 70, textAlign: "center", fontVariantNumeric: "tabular-nums", padding: "4px 12px", borderRadius: 8, background: timer <= 10 ? `${C.danger}15` : `${C.white}08`, border: `1px solid ${timer <= 10 ? `${C.danger}33` : `${C.white}11`}` }}>
          ⏱ {Math.floor(timer / 60)}:{(timer % 60).toString().padStart(2, "0")}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: C.p2, textShadow: `0 0 14px ${C.p2}55`, fontVariantNumeric: "tabular-nums" }}>{scores[1]}</span>
          <span style={{ fontSize: 11, color: C.p2, fontWeight: 800, letterSpacing: 2 }}>포닉스</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "4px 4px", alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.p1, letterSpacing: 3, textTransform: "uppercase", textShadow: `0 0 10px ${C.p1}55` }}>넙죽이 {!alive[0] && "💀"}</div>
          <canvas ref={c1} width={boardSize} height={boardSize} style={{ display: "block" }}
            onTouchStart={(e) => handleTouchStart(e, 1)} onTouchEnd={handleTouchEnd} />
          <div style={{ fontSize: 9, color: C.dim }}>{mode === "local" ? "WASD" : mode === "host" ? "WASD / ←↑↓→" : "상대"}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: C.p2, letterSpacing: 3, textTransform: "uppercase", textShadow: `0 0 10px ${C.p2}55` }}>포닉스 {!alive[1] && "💀"}</div>
          <canvas ref={c2} width={boardSize} height={boardSize} style={{ display: "block" }}
            onTouchStart={(e) => handleTouchStart(e, 2)} onTouchEnd={handleTouchEnd} />
          <div style={{ fontSize: 9, color: C.dim }}>{mode === "local" ? "←↑↓→" : mode === "guest" ? "WASD / ←↑↓→" : "상대"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", flexWrap: "wrap", padding: "3px 0" }}>
        {(phase === "playing" || phase === "paused") && mode === "local" && (
          <Btn onClick={togglePause} color={phase === "paused" ? C.success : C.food} small>{phase === "paused" ? "▶ 계속" : "⏸ 일시정지"}</Btn>
        )}
        {(phase === "playing" || phase === "paused") && <Btn onClick={endGame} color={C.danger} small>⏹ 종료</Btn>}
        {phase === "gameover" && <><Btn onClick={restartGame} color={C.success}>🔄 다시 하기</Btn><Btn onClick={backToLobby} color={C.dim}>🏠 로비</Btn></>}
      </div>

      {phase === "paused" && (
        <div style={S.overlay}>
          <div style={{ fontSize: 38, fontWeight: 900, color: C.food, letterSpacing: 6 }}>PAUSED</div>
          <Btn onClick={togglePause} color={C.success}>▶ 계속하기</Btn>
        </div>
      )}

      {phase === "gameover" && (
        <div style={S.overlay}>
          <div style={{ animation: "fadeIn 0.4s ease-out", textAlign: "center" }}>
            <div style={{ fontSize: 13, color: C.dim, letterSpacing: 5, marginBottom: 8 }}>GAME OVER</div>
            <div style={{ margin: "8px auto 12px", display: "flex", justifyContent: "center" }}>
              <canvas ref={(el) => {
                if (el) { const ctx = el.getContext("2d"); ctx.clearRect(0,0,80,80);
                  if (winner === 1) drawNeopjuki(ctx, 40, 40, 70);
                  else if (winner === 2) drawPhoenix(ctx, 40, 42, 70);
                  else { drawNeopjuki(ctx, 25, 40, 40); drawPhoenix(ctx, 55, 42, 40); }
                }
              }} width={80} height={80} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: 3, marginBottom: 16, color: winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.food, textShadow: `0 0 22px ${winner === 1 ? C.p1 : winner === 2 ? C.p2 : C.food}55` }}>
              {winner === 1 ? "🏆 넙죽이 승리!" : winner === 2 ? "🏆 포닉스 승리!" : "🤝 무승부!"}
            </div>
            <div style={{ display: "flex", gap: 36, justifyContent: "center", marginBottom: 24, padding: "18px 28px", background: C.panel, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.p1, letterSpacing: 2, marginBottom: 4 }}>넙죽이</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: C.p1 }}>{scores[0]}</div>
              </div>
              <div style={{ width: 1, background: C.border }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 10, color: C.p2, letterSpacing: 2, marginBottom: 4 }}>포닉스</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: C.p2 }}>{scores[1]}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Btn onClick={restartGame} color={C.success}>🔄 다시 하기</Btn>
              <Btn onClick={backToLobby} color={C.dim}>🏠 로비</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}