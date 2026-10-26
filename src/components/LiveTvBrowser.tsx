import React, { useState, useRef, useEffect } from 'react';
import { useLiveFeed } from '../context/LiveFeedContext';
import { useWallet } from '../context/WalletContext';
import { BetLeg, LiveGame } from '../types/betting';
import { formatOdds } from '../utils/oddsEngine';
import { 
  Tv, 
  Grid, 
  Columns2, 
  Square, 
  Volume2, 
  VolumeX, 
  Maximize2, 
  Plus, 
  ExternalLink, 
  Radio, 
  Zap, 
  Settings, 
  RotateCw, 
  ChevronRight, 
  Flame, 
  Sparkles,
  Link2,
  Check,
  Minimize2
} from 'lucide-react';

export interface TvChannel {
  id: string;
  name: string;
  sport: string;
  league: string;
  matchTitle: string;
  streamType: 'youtube' | 'twitch' | 'video' | 'embed' | 'canvas';
  streamUrl: string;
  thumbnailUrl?: string;
  gameId: string;
}

const DEFAULT_CHANNELS: TvChannel[] = [
  {
    id: 'ch_nba_live',
    name: 'NBA TV HD · TD Garden',
    sport: 'NBA',
    league: 'NBA Live Broadcast',
    matchTitle: 'Boston Celtics vs Golden State Warriors',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/5qap5aO4i9A?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_nba_celtics_warriors',
  },
  {
    id: 'ch_epl_sky',
    name: 'Sky Sports Premier League',
    sport: 'EPL',
    league: 'Premier League Matchday',
    matchTitle: 'Arsenal FC vs Manchester City',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/21X5lGlDOfg?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_epl_arsenal_mancity',
  },
  {
    id: 'ch_esports_twitch',
    name: 'ESL Pro League CS2 Live',
    sport: 'ESPORTS',
    league: 'CS2 Major Grand Final',
    matchTitle: 'FaZe Clan vs Natus Vincere',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/jfKfPfyJRdk?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_esports_faze_navi',
  },
  {
    id: 'ch_nfl_redzone',
    name: 'NFL Championship RedZone',
    sport: 'NFL',
    league: 'NFL Super Week',
    matchTitle: 'Kansas City Chiefs vs San Francisco 49ers',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/L_LUpnjgPso?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_nfl_chiefs_49ers',
  },
  {
    id: 'ch_tennis_usopen',
    name: 'ESPN Tennis Grand Slam',
    sport: 'TENNIS',
    league: 'US Open Arthur Ashe Stadium',
    matchTitle: 'Carlos Alcaraz vs Jannik Sinner',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/kJQP7kiw5Fk?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_tennis_alcaraz_sinner',
  },
  {
    id: 'ch_extreme_redbull',
    name: 'Red Bull 24/7 Action TV',
    sport: 'ACTION',
    league: 'Motorsports & Extreme Sports',
    matchTitle: 'Formula 1 & Extreme Action Live',
    streamType: 'youtube',
    streamUrl: 'https://www.youtube-nocookie.com/embed/kYnSgXkS-cQ?autoplay=1&mute=1&controls=1&rel=0',
    gameId: 'game_nba_celtics_warriors',
  },
];

interface LiveTvBrowserProps {
  onToggleLeg?: (leg: BetLeg) => void;
  selectedLegs?: BetLeg[];
  isFloating?: boolean;
  onToggleFloating?: () => void;
}

export const LiveTvBrowser: React.FC<LiveTvBrowserProps> = ({
  onToggleLeg,
  selectedLegs = [],
  isFloating = false,
  onToggleFloating,
}) => {
  const { games } = useLiveFeed();
  const { oddsFormat } = useWallet();

  // Multi-view mode: 1 screen, 2 screens split, or 4 screens quad matrix!
  const [viewMode, setViewMode] = useState<'single' | 'dual' | 'quad'>('dual');
  const [activeChannels, setActiveChannels] = useState<string[]>([
    DEFAULT_CHANNELS[0].id,
    DEFAULT_CHANNELS[1].id,
    DEFAULT_CHANNELS[2].id,
    DEFAULT_CHANNELS[3].id,
  ]);

  const [customStreamUrl, setCustomStreamUrl] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number>(0);
  const [audioMutedSlots, setAudioMutedSlots] = useState<Record<number, boolean>>({
    0: true,
    1: true,
    2: true,
    3: true,
  });

  const slotsCount = viewMode === 'single' ? 1 : viewMode === 'dual' ? 2 : 4;

  const handleSelectChannelForSlot = (channelId: string, slotIndex: number) => {
    setActiveChannels((prev) => {
      const copy = [...prev];
      copy[slotIndex] = channelId;
      return copy;
    });
  };

  const handleAddCustomStream = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStreamUrl.trim()) return;

    let parsedUrl = customStreamUrl.trim();
    // Convert regular YouTube watch link to embed format
    if (parsedUrl.includes('youtube.com/watch?v=')) {
      const videoId = parsedUrl.split('watch?v=')[1]?.split('&')[0];
      if (videoId) parsedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1`;
    } else if (parsedUrl.includes('youtu.be/')) {
      const videoId = parsedUrl.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) parsedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1`;
    }

    const newChannel: TvChannel = {
      id: `custom_${Date.now()}`,
      name: 'Custom Live Stream',
      sport: 'CUSTOM',
      league: 'User Stream Ingest',
      matchTitle: 'Live Stream Ingest Feed',
      streamType: 'embed',
      streamUrl: parsedUrl,
      gameId: games[0]?.id || 'game_nba_celtics_warriors',
    };

    DEFAULT_CHANNELS.unshift(newChannel);
    handleSelectChannelForSlot(newChannel.id, selectedSlotIndex);
    setCustomStreamUrl('');
    setShowCustomInput(false);
  };

  const toggleMute = (slotIdx: number) => {
    setAudioMutedSlots((prev) => ({
      ...prev,
      [slotIdx]: !prev[slotIdx],
    }));
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl relative space-y-0">
      {/* Top TV Browser Control Bar */}
      <div className="bg-zinc-950 px-4 py-3 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-rose-400">
              <Tv className="w-4 h-4 animate-pulse" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white tracking-wide flex items-center gap-1.5 font-mono">
                  <span>PROP-X LIVE TV BROWSER</span>
                  <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded font-bold uppercase animate-pulse">
                    LIVE
                  </span>
                </h3>
              </div>
              <p className="text-[11px] text-zinc-400 font-mono">
                Multi-View Simulcast Matrix · Watch live games while wagering
              </p>
            </div>
          </div>
        </div>

        {/* Multi-view Switcher & Custom Stream button */}
        <div className="flex items-center gap-2">
          {/* View mode buttons: Single, Dual, Quad */}
          <div className="flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl font-mono text-[11px]">
            <button
              onClick={() => setViewMode('single')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'single'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="1 Screen Focus View"
            >
              <Square className="w-3.5 h-3.5" />
              <span>1 Screen</span>
            </button>

            <button
              onClick={() => setViewMode('dual')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'dual'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="2 Screens Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span>Dual Split (2)</span>
            </button>

            <button
              onClick={() => setViewMode('quad')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                viewMode === 'quad'
                  ? 'bg-amber-400 text-zinc-950 font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="4 Screens Quad Matrix View"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Quad Matrix (4)</span>
            </button>
          </div>

          {/* Custom Stream URL button */}
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white font-mono text-xs border border-zinc-700 transition-colors cursor-pointer"
            title="Paste any Live Stream, YouTube, or Twitch URL"
          >
            <Link2 className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Add Stream URL</span>
          </button>
        </div>
      </div>

      {/* Custom Stream URL Input Drawer */}
      {showCustomInput && (
        <form
          onSubmit={handleAddCustomStream}
          className="bg-zinc-950/95 border-b border-zinc-800 p-3 flex flex-col sm:flex-row items-center gap-2 text-xs font-mono animate-fade-in"
        >
          <span className="text-zinc-400 whitespace-nowrap">Load URL into Slot:</span>
          <select
            value={selectedSlotIndex}
            onChange={(e) => setSelectedSlotIndex(Number(e.target.value))}
            className="bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1.5 text-white"
          >
            {Array.from({ length: slotsCount }).map((_, i) => (
              <option key={i} value={i}>
                Screen {i + 1}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={customStreamUrl}
            onChange={(e) => setCustomStreamUrl(e.target.value)}
            placeholder="Paste YouTube Live, Twitch embed, or HLS/MP4 video stream URL..."
            className="flex-1 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-1.5 text-white placeholder-zinc-500 outline-none focus:border-amber-400"
          />

          <button
            type="submit"
            className="px-4 py-1.5 rounded-lg bg-amber-400 text-zinc-950 font-bold hover:bg-amber-300 transition-colors whitespace-nowrap cursor-pointer"
          >
            Stream Live
          </button>
        </form>
      )}

      {/* Multi-Stream Matrix Viewport */}
      <div
        className={`grid gap-2 p-2 bg-zinc-950 ${
          viewMode === 'single'
            ? 'grid-cols-1'
            : viewMode === 'dual'
            ? 'grid-cols-1 md:grid-cols-2'
            : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        {Array.from({ length: slotsCount }).map((_, slotIdx) => {
          const channelId = activeChannels[slotIdx] || DEFAULT_CHANNELS[0].id;
          const channel = DEFAULT_CHANNELS.find((c) => c.id === channelId) || DEFAULT_CHANNELS[0];
          const matchedGame = games.find((g) => g.id === channel.gameId) || games[0];

          const isHomeSelected = selectedLegs.some(
            (l) => l.gameId === matchedGame?.id && l.selectionKey === 'home'
          );
          const isAwaySelected = selectedLegs.some(
            (l) => l.gameId === matchedGame?.id && l.selectionKey === 'away'
          );

          return (
            <div
              key={slotIdx}
              className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden flex flex-col justify-between shadow-lg relative group"
            >
              {/* Screen Top Header: Channel Selector dropdown & live badges */}
              <div className="bg-zinc-950/90 px-3 py-1.5 border-b border-zinc-800 flex items-center justify-between text-[11px] font-mono z-10">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                  <span className="text-zinc-500 font-bold">SCREEN {slotIdx + 1}:</span>
                  <select
                    value={channel.id}
                    onChange={(e) => handleSelectChannelForSlot(e.target.value, slotIdx)}
                    className="bg-zinc-900 text-white font-bold border border-zinc-700 rounded px-2 py-0.5 text-xs outline-none cursor-pointer max-w-[160px] sm:max-w-[220px] truncate"
                  >
                    {DEFAULT_CHANNELS.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name} ({ch.sport})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-zinc-400">
                  <span className="hidden sm:inline text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-emerald-400">
                    1080p60
                  </span>
                  <button
                    onClick={() => toggleMute(slotIdx)}
                    className="p-1 rounded hover:bg-zinc-800 text-zinc-300 hover:text-white cursor-pointer"
                    title={audioMutedSlots[slotIdx] ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {audioMutedSlots[slotIdx] ? (
                      <VolumeX className="w-3.5 h-3.5 text-zinc-500" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Embedded Live Video Frame */}
              <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                <iframe
                  src={channel.streamUrl}
                  title={channel.name}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />

                {/* Scorebug Overlay at top left of video */}
                {matchedGame && (
                  <div className="absolute top-2 left-2 bg-zinc-950/85 backdrop-blur-md border border-zinc-800/80 rounded-lg px-2.5 py-1 flex items-center gap-2 text-[11px] font-mono shadow-xl pointer-events-none z-10">
                    <span className="font-bold text-white">{matchedGame.homeTeam.code}</span>
                    <span className="font-black text-amber-400">{matchedGame.homeTeam.score}</span>
                    <span className="text-zinc-600">-</span>
                    <span className="font-black text-amber-400">{matchedGame.awayTeam.score}</span>
                    <span className="font-bold text-white">{matchedGame.awayTeam.code}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-rose-400 font-bold text-[10px]">{matchedGame.clock}</span>
                  </div>
                )}
              </div>

              {/* Bottom Quick-Bet Bar: Watch the game & place wagers immediately! */}
              {matchedGame && (
                <div className="p-2 bg-zinc-950/95 border-t border-zinc-800 flex items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-zinc-400 text-[10px] truncate">
                      {matchedGame.homeTeam.code} vs {matchedGame.awayTeam.code}:
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Home Odds */}
                    <button
                      onClick={() =>
                        onToggleLeg &&
                        onToggleLeg({
                          id: `${matchedGame.id}_ml_home`,
                          gameId: matchedGame.id,
                          matchup: `${matchedGame.homeTeam.code} vs ${matchedGame.awayTeam.code}`,
                          sport: matchedGame.sport,
                          selectionName: `${matchedGame.homeTeam.name} Win`,
                          selectionKey: 'home',
                          marketType: 'MONEYLINE',
                          marketLabel: 'Match Winner',
                          odds: matchedGame.markets.homeOdds,
                          status: 'PENDING',
                        })
                      }
                      className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        isHomeSelected
                          ? 'bg-amber-400 text-zinc-950 font-black'
                          : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>{matchedGame.homeTeam.code}</span>
                      <span className="text-amber-400 font-bold">
                        {formatOdds(matchedGame.markets.homeOdds, oddsFormat)}
                      </span>
                      {isHomeSelected && <Check className="w-3 h-3" />}
                    </button>

                    {/* Away Odds */}
                    <button
                      onClick={() =>
                        onToggleLeg &&
                        onToggleLeg({
                          id: `${matchedGame.id}_ml_away`,
                          gameId: matchedGame.id,
                          matchup: `${matchedGame.homeTeam.code} vs ${matchedGame.awayTeam.code}`,
                          sport: matchedGame.sport,
                          selectionName: `${matchedGame.awayTeam.name} Win`,
                          selectionKey: 'away',
                          marketType: 'MONEYLINE',
                          marketLabel: 'Match Winner',
                          odds: matchedGame.markets.awayOdds,
                          status: 'PENDING',
                        })
                      }
                      className={`px-2.5 py-1 rounded text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAwaySelected
                          ? 'bg-amber-400 text-zinc-950 font-black'
                          : 'bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300'
                      }`}
                    >
                      <span>{matchedGame.awayTeam.code}</span>
                      <span className="text-amber-400 font-bold">
                        {formatOdds(matchedGame.markets.awayOdds, oddsFormat)}
                      </span>
                      {isAwaySelected && <Check className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
