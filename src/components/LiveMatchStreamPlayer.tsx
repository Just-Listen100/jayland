import React, { useState, useEffect, useRef } from 'react';
import { useLiveFeed } from '../context/LiveFeedContext';
import { useWallet } from '../context/WalletContext';
import { LiveGame, BetLeg } from '../types/betting';
import { formatOdds } from '../utils/oddsEngine';
import { 
  Tv, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause, 
  Maximize2, 
  Minimize2, 
  Radio, 
  Zap, 
  Eye, 
  Layers, 
  Share2, 
  Flame,
  Camera,
  Signal,
  Check
} from 'lucide-react';

interface LiveMatchStreamPlayerProps {
  onToggleLeg?: (leg: BetLeg) => void;
  selectedLegs?: BetLeg[];
}

export const LiveMatchStreamPlayer: React.FC<LiveMatchStreamPlayerProps> = ({
  onToggleLeg,
  selectedLegs = [],
}) => {
  const { games } = useLiveFeed();
  const { oddsFormat } = useWallet();

  const [activeGameId, setActiveGameId] = useState<string>(
    games.length > 0 ? games[0].id : 'game_nba_celtics_warriors'
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isAudioMuted, setIsAudioMuted] = useState<boolean>(true);
  const [isTheaterMode, setIsTheaterMode] = useState<boolean>(false);
  const [cameraAngle, setCameraAngle] = useState<'BROADCAST' | 'COURTSIDE' | 'RADAR'>('BROADCAST');
  const [streamBitrate, setStreamBitrate] = useState<number>(5840);
  const [isPipFloating, setIsPipFloating] = useState<boolean>(false);

  // Canvas ref for real-time live animated broadcast feed
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const currentGame = games.find((g) => g.id === activeGameId) || games[0];

  // Bitrate oscillation
  useEffect(() => {
    const bitTimer = setInterval(() => {
      setStreamBitrate(Math.floor(5400 + Math.random() * 900));
    }, 3000);
    return () => clearInterval(bitTimer);
  }, []);

  // Real-time canvas sports match rendering
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let ballX = canvas.width / 2;
    let ballY = canvas.height / 2;
    let ballVx = 3.5;
    let ballVy = 2.0;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Dark stadium background
      const grad = ctx.createLinearGradient(0, 0, 0, h);
      grad.addColorStop(0, '#0c1017');
      grad.addColorStop(0.5, '#131b26');
      grad.addColorStop(1, '#080a0f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Draw sport-specific court/pitch lines
      if (currentGame?.sport === 'NBA') {
        // Hardwood floor texture
        ctx.fillStyle = '#1e1b18';
        ctx.fillRect(40, 30, w - 80, h - 60);

        // Court lines
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 40, w - 100, h - 80);

        // Center circle
        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
        ctx.stroke();

        // 3-point arcs
        ctx.beginPath();
        ctx.arc(50, h / 2, 75, -Math.PI / 2, Math.PI / 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w - 50, h / 2, 75, Math.PI / 2, (3 * Math.PI) / 2);
        ctx.stroke();
      } else if (currentGame?.sport === 'EPL') {
        // Turf pitch
        ctx.fillStyle = '#0f2015';
        ctx.fillRect(40, 30, w - 80, h - 60);

        // Pitch lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(50, 40, w - 100, h - 80);

        // Halfway line & circle
        ctx.beginPath();
        ctx.moveTo(w / 2, 40);
        ctx.lineTo(w / 2, h - 40);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2);
        ctx.stroke();

        // Penalty boxes
        ctx.strokeRect(50, h / 2 - 45, 45, 90);
        ctx.strokeRect(w - 95, h / 2 - 45, 45, 90);
      } else {
        // General arena
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(40, 30, w - 80, h - 60);
        ctx.beginPath();
        ctx.moveTo(w / 2, 30);
        ctx.lineTo(w / 2, h - 30);
        ctx.stroke();
      }

      // Dynamic Ball Physics & Player Simulation
      ballX += ballVx;
      ballY += ballVy;

      if (ballX <= 70 || ballX >= w - 70) ballVx = -ballVx;
      if (ballY <= 50 || ballY >= h - 50) ballVy = -ballVy;

      // Glow behind ball
      const ballGrad = ctx.createRadialGradient(ballX, ballY, 1, ballX, ballY, 18);
      ballGrad.addColorStop(0, 'rgba(251, 191, 36, 0.9)');
      ballGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = ballGrad;
      ctx.beginPath();
      ctx.arc(ballX, ballY, 18, 0, Math.PI * 2);
      ctx.fill();

      // Ball
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(ballX, ballY, 5, 0, Math.PI * 2);
      ctx.fill();

      // Simulated Players (Home & Away positions)
      const homeColor = currentGame?.homeTeam.color || '#3b82f6';
      const awayColor = currentGame?.awayTeam.color || '#ef4444';

      for (let i = 0; i < 4; i++) {
        // Home players
        const px = w * 0.35 + Math.sin(time + i * 1.5) * 45;
        const py = h * 0.25 + i * 38 + Math.cos(time + i) * 15;
        ctx.fillStyle = homeColor;
        ctx.beginPath();
        ctx.arc(px, py, 6, 0, Math.PI * 2);
        ctx.fill();

        // Player shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(px, py + 8, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Away players
        const ax = w * 0.65 + Math.cos(time + i * 1.2) * 45;
        const ay = h * 0.25 + i * 38 + Math.sin(time + i * 1.8) * 15;
        ctx.fillStyle = awayColor;
        ctx.beginPath();
        ctx.arc(ax, ay, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(ax, ay + 8, 7, 3, 0, 0, Math.PI * 2);
        ctx.fill();
      }

      // Simulated broadcast scanlines & stadium lights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
      for (let y = 0; y < h; y += 4) {
        ctx.fillRect(0, y, w, 1);
      }

      // Camera lens vignette
      const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.3, w / 2, h / 2, w * 0.65);
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);

      if (isPlaying) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [isPlaying, currentGame]);

  if (!currentGame) return null;

  const isHomeSelected = selectedLegs.some(
    (l) => l.gameId === currentGame.id && l.selectionKey === 'home'
  );
  const isAwaySelected = selectedLegs.some(
    (l) => l.gameId === currentGame.id && l.selectionKey === 'away'
  );

  return (
    <div
      className={`bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl transition-all ${
        isTheaterMode ? 'col-span-full' : ''
      }`}
    >
      {/* Stream Player Header / Channel Ticker */}
      <div className="bg-zinc-950 px-4 py-2.5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-mono font-bold text-[11px]">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>LIVE 1080p60</span>
          </div>

          {/* Channel Selector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-0.5 font-mono text-[11px]">
            {games.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveGameId(g.id)}
                className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
                  activeGameId === g.id
                    ? 'bg-amber-400 text-zinc-950 font-bold shadow-sm'
                    : 'bg-zinc-900 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
                }`}
              >
                {g.sport}: {g.homeTeam.code} vs {g.awayTeam.code}
              </button>
            ))}
          </div>
        </div>

        {/* Live stream stats & Bitrate */}
        <div className="flex items-center gap-3 text-zinc-400 font-mono text-[11px]">
          <span className="flex items-center gap-1 text-emerald-400">
            <Signal className="w-3.5 h-3.5" />
            <span>{streamBitrate} kbps</span>
          </span>
          <span className="text-zinc-600">·</span>
          <span className="text-zinc-400">Ultra-Low Latency (0.8s)</span>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div className="relative aspect-video w-full bg-zinc-950 overflow-hidden flex items-center justify-center">
        {/* Animated Court/Pitch Broadcast Feed */}
        <canvas
          ref={canvasRef}
          width={840}
          height={472}
          className="w-full h-full object-cover"
        />

        {/* Top-Left: Broadcast TV Scorebug Overlay */}
        <div className="absolute top-4 left-4 bg-zinc-950/90 backdrop-blur-md border border-zinc-800 rounded-xl p-2.5 flex items-center gap-3 shadow-2xl font-mono">
          {/* Home team */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentGame.homeTeam.color }}
            />
            <span className="font-bold text-white text-xs">{currentGame.homeTeam.code}</span>
            <span className="font-black text-amber-400 text-sm">{currentGame.homeTeam.score}</span>
          </div>

          <span className="text-zinc-600">|</span>

          {/* Away team */}
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: currentGame.awayTeam.color }}
            />
            <span className="font-bold text-white text-xs">{currentGame.awayTeam.code}</span>
            <span className="font-black text-amber-400 text-sm">{currentGame.awayTeam.score}</span>
          </div>

          <span className="text-zinc-600">|</span>

          {/* Period & Clock */}
          <div className="px-2 py-0.5 rounded bg-zinc-900 border border-zinc-700/60 text-amber-300 font-bold text-[10px]">
            {currentGame.clock}
          </div>
        </div>

        {/* Top-Right: Camera Angle Switcher */}
        <div className="absolute top-4 right-4 bg-zinc-950/85 backdrop-blur-md border border-zinc-800 rounded-xl p-1 flex items-center gap-1 text-[10px] font-mono">
          <Camera className="w-3.5 h-3.5 text-amber-400 ml-1.5 mr-0.5" />
          {(['BROADCAST', 'COURTSIDE', 'RADAR'] as const).map((cam) => (
            <button
              key={cam}
              onClick={() => setCameraAngle(cam)}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cameraAngle === cam
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {cam}
            </button>
          ))}
        </div>

        {/* Center: Live Action Event Overlay */}
        {currentGame.lastEvent && (
          <div className="absolute bottom-14 left-4 right-4 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-xl px-3 py-2 flex items-center justify-between text-xs font-mono shadow-xl">
            <div className="flex items-center gap-2 truncate">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-400 font-bold uppercase text-[10px]">PLAY HIGHLIGHT:</span>
              <span className="text-zinc-200 truncate">{currentGame.lastEvent}</span>
            </div>
            <span className="text-[10px] text-zinc-500 font-bold uppercase whitespace-nowrap ml-2">
              PROP-X RADAR AI
            </span>
          </div>
        )}

        {/* Bottom Stream Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 flex items-center justify-between text-xs text-zinc-300">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer"
              title={isPlaying ? 'Pause Stream' : 'Play Stream'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            {/* Audio Toggle */}
            <button
              onClick={() => setIsAudioMuted(!isAudioMuted)}
              className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-white transition-colors cursor-pointer flex items-center gap-1 font-mono text-[10px]"
              title={isAudioMuted ? 'Unmute Stadium Audio' : 'Mute'}
            >
              {isAudioMuted ? <VolumeX className="w-4 h-4 text-zinc-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              <span>{isAudioMuted ? 'CROWD MUTED' : 'STADIUM FX'}</span>
            </button>

            <span className="font-mono text-[11px] text-zinc-400 hidden sm:inline">
              {currentGame.league} · Live Broadcast
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Theater Mode */}
            <button
              onClick={() => setIsTheaterMode(!isTheaterMode)}
              className="p-1.5 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title={isTheaterMode ? 'Standard View' : 'Theater View'}
            >
              {isTheaterMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Bet Bar Directly Under Stream: Slap a wager while watching! */}
      <div className="p-3 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-md bg-amber-400/10 text-amber-400 font-mono font-bold text-[10px]">
            STREAM BET
          </span>
          <span className="text-zinc-400 font-medium">In-Play Lines:</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Home ML */}
          <button
            onClick={() =>
              onToggleLeg &&
              onToggleLeg({
                id: `${currentGame.id}_ml_home`,
                gameId: currentGame.id,
                matchup: `${currentGame.homeTeam.code} vs ${currentGame.awayTeam.code}`,
                sport: currentGame.sport,
                selectionName: `${currentGame.homeTeam.name} Win`,
                selectionKey: 'home',
                marketType: 'MONEYLINE',
                marketLabel: 'Match Winner',
                odds: currentGame.markets.homeOdds,
                status: 'PENDING',
              })
            }
            className={`px-3 py-1.5 rounded-lg font-mono flex items-center gap-2 transition-all cursor-pointer ${
              isHomeSelected
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200'
            }`}
          >
            <span>{currentGame.homeTeam.code}</span>
            <span className="font-bold text-amber-400">
              {formatOdds(currentGame.markets.homeOdds, oddsFormat)}
            </span>
            {isHomeSelected && <Check className="w-3.5 h-3.5" />}
          </button>

          {/* Away ML */}
          <button
            onClick={() =>
              onToggleLeg &&
              onToggleLeg({
                id: `${currentGame.id}_ml_away`,
                gameId: currentGame.id,
                matchup: `${currentGame.homeTeam.code} vs ${currentGame.awayTeam.code}`,
                sport: currentGame.sport,
                selectionName: `${currentGame.awayTeam.name} Win`,
                selectionKey: 'away',
                marketType: 'MONEYLINE',
                marketLabel: 'Match Winner',
                odds: currentGame.markets.awayOdds,
                status: 'PENDING',
              })
            }
            className={`px-3 py-1.5 rounded-lg font-mono flex items-center gap-2 transition-all cursor-pointer ${
              isAwaySelected
                ? 'bg-amber-400 text-zinc-950 font-bold'
                : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-200'
            }`}
          >
            <span>{currentGame.awayTeam.code}</span>
            <span className="font-bold text-amber-400">
              {formatOdds(currentGame.markets.awayOdds, oddsFormat)}
            </span>
            {isAwaySelected && <Check className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
