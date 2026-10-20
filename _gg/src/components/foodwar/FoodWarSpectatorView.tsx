'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, LogOut, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface FoodWarSpectatorViewProps {
  roomCode: string;
}

interface SpectatorInfo {
  id: string;
  name: string;
  joinedAt: number;
  lastSeen: number;
}

interface RoomData {
  code: string;
  hostName: string;
  phase: string;
  stateJson: string;
  spectators: SpectatorInfo[];
}

export default function FoodWarSpectatorView({ roomCode }: FoodWarSpectatorViewProps) {
  const [room, setRoom] = useState<RoomData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchRoom() {
      try {
        const res = await fetch(`/api/foodwar-room/${roomCode}`);
        if (!res.ok) {
          if (mounted) {
            setError('الغرفة غير موجودة أو انتهت صلاحيتها');
            setLoading(false);
          }
          return;
        }
        const data = await res.json();
        if (mounted) {
          setRoom(data.room);
          setLoading(false);
        }
      } catch {
        if (mounted) {
          setError('تعذر الاتصال بالخادم');
          setLoading(false);
        }
      }
    }

    fetchRoom();
    intervalRef.current = setInterval(fetchRoom, 3000);

    return () => {
      mounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [roomCode]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-orange-400 mx-auto mb-3" />
          <p className="text-slate-400 text-sm">جاري تحميل الغرفة...</p>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center tobol-bg" dir="rtl">
        <Card className="bg-slate-900/80 border-orange-500/30 max-w-sm">
          <CardContent className="pt-6 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-orange-300 text-sm mb-4">{error || 'الغرفة غير موجودة'}</p>
            <a href="/foodwar" className="text-xs text-slate-400 hover:text-slate-200">
              ← العودة لصفحة اللعبة
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Parse stateJson to extract game info
  let stateInfo: any = {};
  try { stateInfo = JSON.parse(room.stateJson || '{}'); } catch {}

  const players: any[] = stateInfo.players ?? [];
  const alivePlayers = players.filter(p => p.isAlive);
  const currentRound = stateInfo.currentRound ?? 0;
  const turnPhase = stateInfo.turnPhase ?? 'spinning';
  const lastAction = stateInfo.lastAction ?? '';
  const gameLog: any[] = stateInfo.gameLog ?? [];
  const recentLogs = gameLog.slice(-5).reverse();

  return (
    <div
      dir="rtl"
      className="min-h-screen flex flex-col items-center p-4"
      style={{ background: 'linear-gradient(180deg, #0a0b10 0%, #1a0e08 40%, #0a0b10 100%)' }}
    >
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            className="text-5xl mb-2 inline-block"
          >
            🍕
          </motion.div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">
            حرب الاكلات — المشاهدة
          </h1>
          <p className="text-xs text-slate-400 mt-1">كود الغرفة: <span className="text-orange-300 font-mono tracking-widest">{room.code}</span></p>
        </div>

        <Card className="bg-slate-900/80 border-orange-500/30 mb-4">
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-orange-400" />
                <span className="text-sm text-orange-300 font-bold">حالة اللعبة</span>
              </div>
              <span className="text-xs px-2 py-1 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                {room.phase === 'game_over' ? 'انتهت' : room.phase === 'playing' ? 'جارية' : 'تجهيز'}
              </span>
            </div>
            <div className="text-sm text-slate-300 mb-2">
              الجولة الحالية: <span className="font-bold text-orange-300">{currentRound || 1}</span>
            </div>
            <div className="text-sm text-slate-300 mb-2">
              اللاعبون الأحياء: <span className="font-bold text-emerald-300">{alivePlayers.length}</span> / {players.length}
            </div>
            <div className="text-sm text-slate-300">
              المرحلة: <span className="font-bold text-amber-300">{
                turnPhase === 'spinning' ? 'دوران العجلة' :
                turnPhase === 'selecting' ? 'اختيار الطعام' :
                turnPhase === 'revealing' ? 'كشف المختبئ' :
                'الجولة التالية'
              }</span>
            </div>
            {lastAction && (
              <div className="mt-3 p-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-xs text-orange-200">
                {lastAction}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900/80 border-slate-700/50 mb-4">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-bold">اللاعبون</span>
            </div>
            {players.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">لا يوجد لاعبون بعد</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {players.map((p, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      p.isAlive
                        ? 'bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-slate-800/50 border-slate-700/50 opacity-60'
                    }`}
                  >
                    <span className="text-lg" style={{ color: p.color }}>{p.emoji || '🎮'}</span>
                    <span className="text-sm text-slate-200 truncate">{p.name}</span>
                    {!p.isAlive && <span className="text-xs text-slate-500">💀</span>}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {recentLogs.length > 0 && (
          <Card className="bg-slate-900/80 border-slate-700/50 mb-4">
            <CardContent className="pt-5">
              <div className="text-sm text-slate-300 font-bold mb-2">آخر الأحداث</div>
              <div className="space-y-1">
                {recentLogs.map((log, i) => (
                  <div key={i} className="text-xs text-slate-400 border-b border-slate-700/30 pb-1">
                    <span className="text-slate-500">[جولة {log.round}]</span> {log.message}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-slate-900/80 border-slate-700/50">
          <CardContent className="pt-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-blue-300 font-bold">المشاهدون ({room.spectators?.length ?? 0})</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {room.spectators?.map((s, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  👁 {s.name}
                </span>
              )) || <span className="text-xs text-slate-500">لا يوجد مشاهدون</span>}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <a href="/foodwar">
            <Button variant="outline" className="bg-slate-900/60 border-slate-700/50 text-slate-300 hover:bg-slate-800/60">
              <LogOut className="w-4 h-4 ml-2" />
              العودة للعبة
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
