import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  PanResponder,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Svg, { Rect, Circle, Line, Path, G, Text as SvgText, Polygon, Image as SvgImage } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCoach } from '../context/CoachContext';
import { Colors, Fonts, Radius, Spacing } from '../theme';

// ─── Types (exported so PlaymakerScreen can use them) ─────────────────────────

export type Sport    = 'soccer' | 'basketball' | 'football' | 'baseball' | 'volleyball';
export type PlayCat  = 'offense' | 'defense' | 'set-piece' | 'special';
type Tool            = 'offense' | 'defense' | 'ball' | 'draw' | 'arrow' | 'erase';
type DefenseShape    = 'x' | 'triangle' | 'square' | 'diamond';
type Point           = { x: number; y: number }; // normalized 0–1

export interface PlayToken {
  id: string;
  nx: number;
  ny: number;
  label: string;
  team: 'offense' | 'defense' | 'ball';
  shape?: DefenseShape;
}

export interface PlayRoute {
  id: string;
  points: Point[];
  color: string;
  arrow?: boolean;
}

export interface Play {
  id: string;
  name: string;
  description: string;
  sport: Sport;
  category: PlayCat;
  tokens: PlayToken[];
  routes: PlayRoute[];
  createdAt: number;
}

// ─── Module-level store (replaces Firestore until wired up) ──────────────────

export let pendingPlay: Play | null = null;
export const setPendingPlay  = (p: Play) => { pendingPlay = p; };
export const clearPendingPlay = () => { pendingPlay = null; };

// ─── Constants ────────────────────────────────────────────────────────────────

const SPORTS: { id: Sport; icon: string; label: string }[] = [
  { id: 'soccer',     icon: '⚽', label: 'Soccer'     },
  { id: 'basketball', icon: '🏀', label: 'Basketball' },
  { id: 'football',   icon: '🏈', label: 'Football'   },
  { id: 'baseball',   icon: '⚾', label: 'Baseball'   },
  { id: 'volleyball', icon: '🏐', label: 'Volleyball' },
];

const CATEGORIES: { id: PlayCat; label: string }[] = [
  { id: 'offense',   label: 'OFFENSE'   },
  { id: 'defense',   label: 'DEFENSE'   },
  { id: 'set-piece', label: 'SET PIECE' },
  { id: 'special',   label: 'SPECIAL'   },
];

const TOOLS: { id: Tool; icon: string; label: string }[] = [
  { id: 'offense', icon: '●', label: 'OFF'   },
  { id: 'defense', icon: '✕', label: 'DEF'   },
  { id: 'draw',    icon: '✏', label: 'DRAW'  },
  { id: 'arrow',   icon: '↗', label: 'ARROW' },
  { id: 'erase',   icon: '⌫', label: 'ERSR'  },
];

const DEFENSE_SHAPES: { id: DefenseShape; icon: string }[] = [
  { id: 'x',        icon: '✕' },
  { id: 'triangle', icon: '△' },
  { id: 'square',   icon: '▢' },
  { id: 'diamond',  icon: '◇' },
];

// ─── SVG Path helpers ─────────────────────────────────────────────────────────

function smoothPath(pts: Point[]): string {
  if (pts.length < 2) return '';
  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i].x + pts[i + 1].x) / 2;
    const my = (pts[i].y + pts[i + 1].y) / 2;
    d += ` Q${pts[i].x},${pts[i].y} ${mx},${my}`;
  }
  d += ` L${pts[pts.length - 1].x},${pts[pts.length - 1].y}`;
  return d;
}

function arrowHead(pts: Point[]): string {
  if (pts.length < 2) return '';
  const last = pts[pts.length - 1];
  const prev = pts[Math.max(0, pts.length - 3)]; // look back a bit for smoother angle
  const angle = Math.atan2(last.y - prev.y, last.x - prev.x);
  const s = 11;
  const l = { x: last.x - s * Math.cos(angle - Math.PI / 5), y: last.y - s * Math.sin(angle - Math.PI / 5) };
  const r = { x: last.x - s * Math.cos(angle + Math.PI / 5), y: last.y - s * Math.sin(angle + Math.PI / 5) };
  return `M${l.x},${l.y} L${last.x},${last.y} L${r.x},${r.y}`;
}

// ─── Field Backgrounds ────────────────────────────────────────────────────────

export function SoccerField({ w, h, dim = false }: { w: number; h: number; dim?: boolean }) {
  const op = dim ? 0.5 : 1;
  const lc = `rgba(255,255,255,${dim ? 0.18 : 0.32})`;
  const bg = dim ? '#152e15' : '#1b521b';
  const pw = w * 0.6, ph = h * 0.17;
  const px = (w - pw) / 2;
  const cr = Math.min(w, h) * 0.13;

  // Penalty arc: circle centred on penalty spot (11% of height from endline)
  const arcR  = h * 0.095;
  const penDy = ph - h * 0.11;   // distance from pen spot to far edge of box
  const arcDx = Math.sqrt(Math.max(0, arcR * arcR - penDy * penDy));
  const arcX1 = w / 2 - arcDx;
  const arcX2 = w / 2 + arcDx;

  // Goal mouth (protrudes inward from each endline)
  const gw = w * 0.2;
  const gh = h * 0.022;
  const gx = (w - gw) / 2;

  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill={bg} rx={6} opacity={op} />
      {Array.from({ length: 5 }).map((_, i) => (
        <Rect key={i} x={0} y={(h / 5) * i} width={w} height={h / 10} fill={`rgba(0,0,0,${dim ? 0.04 : 0.07})`} />
      ))}
      <Rect x={3} y={3} width={w - 6} height={h - 6} stroke={lc} strokeWidth={1.5} fill="none" rx={4} />
      <Line x1={3} y1={h / 2} x2={w - 3} y2={h / 2} stroke={lc} strokeWidth={1.5} />
      <Circle cx={w / 2} cy={h / 2} r={cr} stroke={lc} strokeWidth={1.5} fill="none" />
      <Circle cx={w / 2} cy={h / 2} r={3} fill={lc} />

      {/* Penalty boxes */}
      <Rect x={px} y={3} width={pw} height={ph} stroke={lc} strokeWidth={1.5} fill="none" />
      <Rect x={px} y={h - 3 - ph} width={pw} height={ph} stroke={lc} strokeWidth={1.5} fill="none" />

      {/* 6-yard boxes */}
      <Rect x={w * 0.36} y={3} width={w * 0.28} height={h * 0.042} stroke={lc} strokeWidth={1.5} fill={`rgba(255,255,255,${dim ? 0.04 : 0.08})`} />
      <Rect x={w * 0.36} y={h - 3 - h * 0.042} width={w * 0.28} height={h * 0.042} stroke={lc} strokeWidth={1.5} fill={`rgba(255,255,255,${dim ? 0.04 : 0.08})`} />

      {/* Penalty arcs — D-shape curving away from each goal */}
      <Path d={`M${arcX1},${3 + ph} A${arcR},${arcR} 0 0,0 ${arcX2},${3 + ph}`} stroke={lc} strokeWidth={1.5} fill="none" />
      <Path d={`M${arcX1},${h - 3 - ph} A${arcR},${arcR} 0 0,1 ${arcX2},${h - 3 - ph}`} stroke={lc} strokeWidth={1.5} fill="none" />

      {/* Goals — small filled rectangles on each endline */}
      <Rect x={gx} y={3} width={gw} height={gh} stroke={lc} strokeWidth={1.5} fill={`rgba(255,255,255,${dim ? 0.06 : 0.14})`} />
      <Rect x={gx} y={h - 3 - gh} width={gw} height={gh} stroke={lc} strokeWidth={1.5} fill={`rgba(255,255,255,${dim ? 0.06 : 0.14})`} />
    </>
  );
}

export function BasketballCourt({ w, h, dim = false }: { w: number; h: number; dim?: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill="#b8975a" rx={6} />
      <SvgImage
        href={require('../../assets/Basketball-Court.png')}
        x={0}
        y={0}
        width={w}
        height={h}
        preserveAspectRatio="none"
        opacity={dim ? 0.5 : 1}
      />
    </>
  );
}

export function FootballField({ w, h, dim = false }: { w: number; h: number; dim?: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill="#3a6b3a" rx={6} />
      <SvgImage
        href={require('../../assets/Football-Field2.png')}
        x={0}
        y={0}
        width={w}
        height={h}
        preserveAspectRatio="none"
        opacity={dim ? 0.5 : 1}
      />
    </>
  );
}

export function BaseballField({ w, h, dim = false }: { w: number; h: number; dim?: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill="#2d6b27" rx={6} />
      <SvgImage
        href={require('../../assets/Baseball-Field.png')}
        x={0}
        y={0}
        width={w}
        height={h}
        preserveAspectRatio="none"
        opacity={dim ? 0.5 : 1}
      />
    </>
  );
}

export function VolleyballCourt({ w, h, dim = false }: { w: number; h: number; dim?: boolean }) {
  return (
    <>
      <Rect x={0} y={0} width={w} height={h} fill="#c87941" rx={6} />
      <SvgImage
        href={require('../../assets/Volleyball-Court.png')}
        x={0}
        y={0}
        width={w}
        height={h}
        preserveAspectRatio="none"
        opacity={dim ? 0.5 : 1}
      />
    </>
  );
}

function GenericGrid({ w, h }: { w: number; h: number }) {
  const step = 40;
  const cols = Math.ceil(w / step);
  const rows = Math.ceil(h / step);
  return (
    <>
      {/* Base fill */}
      <Rect x={0} y={0} width={w} height={h} fill="#2e2e2e" rx={8} />
      {/* Vertical grid lines */}
      {Array.from({ length: cols + 1 }, (_, i) => (
        <Line key={`v${i}`} x1={i * step} y1={0} x2={i * step} y2={h}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      {/* Horizontal grid lines */}
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Line key={`h${i}`} x1={0} y1={i * step} x2={w} y2={i * step}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      {/* Centre line */}
      <Line x1={0} y1={h / 2} x2={w} y2={h / 2}
        stroke="rgba(255,255,255,0.18)" strokeWidth={1.5} strokeDasharray="6,6" />
      {/* Border */}
      <Rect x={1} y={1} width={w - 2} height={h - 2}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1.5} fill="none" rx={7} />
    </>
  );
}

export function FieldBackground({ sport, w, h, dim = false }: { sport: Sport; w: number; h: number; dim?: boolean }) {
  if (!w || !h) return null;
  return <GenericGrid w={w} h={h} />;
}

// ─── Defense token shapes ─────────────────────────────────────────────────────

function DefenseToken({ t, px, py }: { t: PlayToken; px: number; py: number }) {
  switch (t.shape) {
    case 'triangle': {
      const r = 19;
      const pts = `${px},${py - r} ${px - r * 0.866},${py + r * 0.5} ${px + r * 0.866},${py + r * 0.5}`;
      return (
        <G key={t.id}>
          <Polygon points={pts} fill={Colors.blue} stroke="#fff" strokeWidth={1.5} />
          <SvgText x={px} y={py + 5} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">{t.label}</SvgText>
        </G>
      );
    }
    case 'square': {
      const s = 15;
      return (
        <G key={t.id}>
          <Rect x={px - s} y={py - s} width={s * 2} height={s * 2} fill={Colors.amber} stroke="#fff" strokeWidth={1.5} />
          <SvgText x={px} y={py + 5} textAnchor="middle" fill="#000" fontSize={10} fontWeight="bold">{t.label}</SvgText>
        </G>
      );
    }
    case 'diamond': {
      const d = 19;
      const pts = `${px},${py - d} ${px + d},${py} ${px},${py + d} ${px - d},${py}`;
      return (
        <G key={t.id}>
          <Polygon points={pts} fill="#1a1a2e" stroke="#fff" strokeWidth={1.5} />
          <SvgText x={px} y={py + 5} textAnchor="middle" fill="#fff" fontSize={10} fontWeight="bold">{t.label}</SvgText>
        </G>
      );
    }
    default: // 'x'
      return (
        <G key={t.id}>
          <Circle cx={px} cy={py} r={17} fill={Colors.red} stroke="#fff" strokeWidth={1.5} />
          <SvgText x={px} y={py + 9} textAnchor="middle" fill="#fff" fontSize={22} fontWeight="bold">✕</SvgText>
        </G>
      );
  }
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function PlayEditorScreen({ navigation, route }: any) {
  const existingPlay: Play | undefined = route?.params?.play;
  const viewOnly: boolean = route?.params?.viewOnly ?? false;

  const { coachSport } = useCoach();
  const sport = existingPlay?.sport ?? coachSport;
  const [category, setCategory] = useState<PlayCat>(existingPlay?.category ?? 'offense');
  const [tool,     setTool]     = useState<Tool>('offense');
  const [tokens,   setTokens]   = useState<PlayToken[]>(existingPlay?.tokens ?? []);
  const [routes,   setRoutes]   = useState<PlayRoute[]>(existingPlay?.routes ?? []);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [canvasSize,  setCanvasSize]  = useState({ w: 0, h: 0 });
  const [saveModal, setSaveModal] = useState(false);
  const [nameInput, setNameInput] = useState(existingPlay?.name ?? 'New Play');
  const [descInput, setDescInput] = useState(existingPlay?.description ?? '');

  // Refs so PanResponder always sees fresh values (created once)
  const [defenseShape,     setDefenseShape]     = useState<DefenseShape>('x');
  const [showShapePicker, setShowShapePicker] = useState(false);

  const toolRef           = useRef<Tool>('offense');
  const tokensRef         = useRef<PlayToken[]>([]);
  const canvasRef         = useRef({ w: 0, h: 0 });
  const isDrawing         = useRef(false);
  const draggingTokenId   = useRef<string | null>(null);
  const defenseShapeRef   = useRef<DefenseShape>('x');
  const sportRef          = useRef<Sport>('soccer');

  toolRef.current         = tool;
  tokensRef.current       = tokens;
  defenseShapeRef.current = defenseShape;
  sportRef.current        = sport;

  const handleLayout = useCallback((e: any) => {
    const { width, height } = e.nativeEvent.layout;
    setCanvasSize({ w: width, h: height });
    canvasRef.current = { w: width, h: height };
  }, []);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !viewOnly,
    onMoveShouldSetPanResponder:  () => !viewOnly && (toolRef.current === 'draw' || toolRef.current === 'arrow'),

    onPanResponderGrant: (evt) => {
      const { locationX: lx, locationY: ly } = evt.nativeEvent;
      const { w, h } = canvasRef.current;
      if (!w || viewOnly) return;
      const t = toolRef.current;

      if (t === 'offense' || t === 'defense' || t === 'ball') {
        // Touching an existing token → drag it
        const hit = tokensRef.current.find(tk =>
          Math.hypot(tk.nx * w - lx, tk.ny * h - ly) < 25
        );
        if (hit) {
          draggingTokenId.current = hit.id;
          return;
        }
        // Empty canvas → place new token
        setTokens(prev => {
          if (t === 'ball') {
            const emoji = SPORTS.find(s => s.id === sportRef.current)?.icon ?? '⚽';
            return [...prev, { id: `${Date.now()}`, nx: lx / w, ny: ly / h, label: emoji, team: 'ball' }];
          }
          const count = prev.filter(tk => tk.team === t).length;
          const label = t === 'offense'
            ? String(count + 1)
            : String.fromCharCode(65 + count); // A, B, C…
          return [...prev, { id: `${Date.now()}`, nx: lx / w, ny: ly / h, label, team: t, shape: t === 'defense' ? defenseShapeRef.current : undefined }];
        });
      } else if (t === 'draw' || t === 'arrow') {
        isDrawing.current = true;
        setCurrentPath([{ x: lx, y: ly }]);
      } else if (t === 'erase') {
        const nx = lx / w, ny = ly / h, thresh = 0.06;
        const tIdx = tokensRef.current.findIndex(tk => Math.hypot(tk.nx - nx, tk.ny - ny) < thresh);
        if (tIdx >= 0) {
          setTokens(prev => prev.filter((_, i) => i !== tIdx));
        } else {
          setRoutes(prev => prev.filter(r => !r.points.some(p => Math.hypot(p.x - nx, p.y - ny) < thresh)));
        }
      }
    },

    onPanResponderMove: (evt) => {
      const { locationX, locationY } = evt.nativeEvent;
      const { w, h } = canvasRef.current;

      if (draggingTokenId.current) {
        const id = draggingTokenId.current;
        setTokens(prev => prev.map(tk =>
          tk.id === id
            ? { ...tk, nx: Math.max(0, Math.min(1, locationX / w)), ny: Math.max(0, Math.min(1, locationY / h)) }
            : tk
        ));
        return;
      }

      if ((toolRef.current === 'draw' || toolRef.current === 'arrow') && isDrawing.current) {
        setCurrentPath(prev => [...prev, { x: locationX, y: locationY }]);
      }
    },

    onPanResponderRelease: () => {
      if (draggingTokenId.current) {
        draggingTokenId.current = null;
        return;
      }
      if ((toolRef.current === 'draw' || toolRef.current === 'arrow') && isDrawing.current) {
        const { w, h } = canvasRef.current;
        const isArrow = toolRef.current === 'arrow';
        setCurrentPath(prev => {
          if (prev.length > 3) {
            const pts = prev.map(p => ({ x: p.x / w, y: p.y / h }));
            setRoutes(r => [...r, { id: `${Date.now()}`, points: pts, color: Colors.cyan, arrow: isArrow }]);
          }
          return [];
        });
        isDrawing.current = false;
      }
    },
  })).current;

  const handleSave = () => {
    const play: Play = {
      id:          existingPlay?.id ?? `${Date.now()}`,
      name:        nameInput.trim() || 'Untitled Play',
      description: descInput.trim(),
      sport,
      category,
      tokens,
      routes,
      createdAt:   existingPlay?.createdAt ?? Date.now(),
    };
    setPendingPlay(play);
    setSaveModal(false);
    navigation?.goBack();
  };

  // Scale normalized points → canvas pixels for rendering
  const scale = (pts: Point[]) =>
    canvasSize.w ? pts.map(p => ({ x: p.x * canvasSize.w, y: p.y * canvasSize.h })) : [];

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← BACK</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {viewOnly ? existingPlay?.name?.toUpperCase() ?? 'PLAY' : nameInput.toUpperCase()}
        </Text>
        {!viewOnly && (
          <TouchableOpacity
            style={styles.saveHeaderBtn}
            onPress={() => setSaveModal(true)}
          >
            <Text style={styles.saveHeaderText}>SAVE</Text>
          </TouchableOpacity>
        )}
        {viewOnly && <View style={{ width: 50 }} />}
      </View>

      <View style={{ maxWidth: 800, alignSelf: 'center', width: '100%', flex: 1 }}>
      {/* Canvas */}
      <View
        style={styles.canvasWrap}
        onLayout={handleLayout}
        {...(!viewOnly ? panResponder.panHandlers : {})}
      >
        {canvasSize.w > 0 && (
          <Svg width={canvasSize.w} height={canvasSize.h} style={StyleSheet.absoluteFill}>
            <FieldBackground sport={sport} w={canvasSize.w} h={canvasSize.h} />

            {/* Saved routes */}
            {routes.map(r => {
              const pts = scale(r.points);
              return (
                <G key={r.id}>
                  <Path d={smoothPath(pts)} stroke={r.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  {pts.length > 1 && r.arrow && (
                    <Path d={arrowHead(pts)} stroke={r.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  )}
                </G>
              );
            })}

            {/* Active drawing path */}
            {currentPath.length > 1 && (
              <Path
                d={smoothPath(currentPath)}
                stroke={Colors.amber}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="6,4"
              />
            )}

            {/* Tokens */}
            {tokens.map(t => {
              const px = t.nx * canvasSize.w;
              const py = t.ny * canvasSize.h;
              if (t.team === 'ball') return null; // rendered outside SVG
              return t.team === 'offense' ? (
                <G key={t.id}>
                  <Circle cx={px} cy={py} r={17} fill={Colors.amber} stroke="#fff" strokeWidth={1.5} />
                  <SvgText x={px} y={py + 5} textAnchor="middle" fill="#000" fontSize={13} fontWeight="bold">{t.label}</SvgText>
                </G>
              ) : (
                <DefenseToken key={t.id} t={t} px={px} py={py} />
              );
            })}
          </Svg>
        )}

        {/* Ball tokens — rendered as RN Text (SVG can't display emoji) */}
        {tokens.filter(t => t.team === 'ball').map(t => (
          <Text
            key={t.id}
            pointerEvents="none"
            style={{
              position: 'absolute',
              left: t.nx * canvasSize.w - 9,
              top:  t.ny * canvasSize.h - 9,
              fontSize: 16,
              lineHeight: 18,
            }}
          >
            {t.label}
          </Text>
        ))}

        {/* Empty state hint */}
        {tokens.length === 0 && routes.length === 0 && !viewOnly && (
          <View style={styles.emptyHint} pointerEvents="none">
            <Text style={styles.emptyHintText}>Tap to place players{'\n'}Switch to DRAW for routes</Text>
          </View>
        )}
      </View>

      {/* Defense shape picker — expands above toolbar when DEF tool is active */}
      {!viewOnly && tool === 'defense' && showShapePicker && (
        <View style={styles.shapePicker}>
          {DEFENSE_SHAPES.map(s => (
            <TouchableOpacity
              key={s.id}
              style={[styles.shapeBtn, defenseShape === s.id && styles.shapeBtnActive]}
              onPress={() => setDefenseShape(s.id)}
            >
              <Text style={[styles.shapeBtnIcon, defenseShape === s.id && { color: Colors.red }]}>
                {s.icon}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Toolbar (hidden in view mode) */}
      {!viewOnly && (
        <View style={styles.toolbar}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <TouchableOpacity
              style={[styles.toolBtn, tool === 'ball' && styles.toolBtnActive]}
              onPress={() => { setTool('ball'); setShowShapePicker(false); }}
            >
              <Text style={styles.sportBallIcon}>
                {SPORTS.find(s => s.id === sport)?.icon}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.utilBtn}
              onPress={() => { setTokens([]); setRoutes([]); }}
            >
              <Text style={styles.utilBtnText}>CLR</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.toolBtns}>
            {TOOLS.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.toolBtn, tool === t.id && styles.toolBtnActive]}
                onPress={() => {
                  setTool(t.id);
                  if (t.id === 'defense') setShowShapePicker(prev => tool === 'defense' ? !prev : true);
                  else setShowShapePicker(false);
                }}
              >
                <Text style={[styles.toolBtnIcon, tool === t.id && { color: Colors.cyan }]}>{t.icon}</Text>
                <Text style={[styles.toolBtnLabel, tool === t.id && { color: Colors.cyan }]}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={styles.utilBtn}
            onPress={() => {
              if (routes.length > 0) setRoutes(p => p.slice(0, -1));
              else if (tokens.length > 0) setTokens(p => p.slice(0, -1));
            }}
          >
            <Text style={styles.utilBtnText}>↩</Text>
          </TouchableOpacity>
        </View>
      )}
      </View>

      {/* Save Modal */}
      <Modal visible={saveModal} transparent animationType="slide" onRequestClose={() => setSaveModal(false)}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <TouchableWithoutFeedback onPress={() => setSaveModal(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.saveSheet}>
            <View style={styles.saveHandle} />
            <Text style={styles.saveTitle}>SAVE PLAY</Text>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              <Text style={styles.saveFieldLabel}>PLAY NAME</Text>
              <TextInput
                style={styles.saveInput}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="e.g. 4-3-3 High Press"
                placeholderTextColor={Colors.muted}
                autoFocus
                returnKeyType="next"
              />

              <Text style={styles.saveFieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.saveInput, styles.saveInputMulti]}
                value={descInput}
                onChangeText={setDescInput}
                placeholder="Optional notes about this play..."
                placeholderTextColor={Colors.muted}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.saveFieldLabel}>CATEGORY</Text>
              <View style={styles.catRow}>
                {CATEGORIES.map(c => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.catBtn, category === c.id && styles.catBtnActive]}
                    onPress={() => setCategory(c.id)}
                  >
                    <Text style={[styles.catBtnText, category === c.id && { color: Colors.cyan }]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity style={[styles.confirmSaveBtn, { marginBottom: 16 }]} onPress={handleSave}>
                <Text style={styles.confirmSaveBtnText}>✓ SAVE TO PLAYBOOK</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: 'rgba(5,10,22,0.98)', borderBottomWidth: 1, borderBottomColor: Colors.border2,
  },
  backBtn:       { padding: 4 },
  backText:      { fontFamily: Fonts.mono, fontSize: 10, color: Colors.dim, letterSpacing: 1 },
  headerTitle:   { fontFamily: Fonts.orbitron, fontSize: 12, color: Colors.text, letterSpacing: 1, flex: 1, textAlign: 'center' },
  saveHeaderBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.full, backgroundColor: Colors.cyan },
  saveHeaderText:{ fontFamily: Fonts.orbitron, fontSize: 10, color: '#000', letterSpacing: 1 },

  sportScroll:        { flexGrow: 0, backgroundColor: 'rgba(5,10,22,0.9)', borderBottomWidth: 1, borderBottomColor: Colors.border },
  sportScrollContent: { paddingHorizontal: 6, paddingVertical: 4, gap: 4 },
  sportTab:           { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: Radius.full, borderWidth: 1, borderColor: 'transparent' },
  sportTabActive:     { borderColor: `${Colors.cyan}55`, backgroundColor: 'rgba(0,212,255,0.07)' },
  sportTabIcon:       { fontSize: 14 },
  sportTabLabel:      { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 0.5 },

  canvasWrap: {
    flex: 1, margin: 10, borderRadius: Radius.lg, overflow: 'hidden',
    backgroundColor: '#1b521b',
  },
  emptyHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyHintText: { fontFamily: Fonts.mono, fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 20, letterSpacing: 0.5 },

  toolbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: 'rgba(4,8,18,0.98)', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  toolBtns: { flexDirection: 'row', gap: 8 },
  toolBtn: {
    width: 52, height: 52, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, backgroundColor: 'rgba(61,143,255,0.05)',
    alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  toolBtnActive: { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
  toolBtnIcon:   { fontSize: 18, color: Colors.dim },
  toolBtnLabel:  { fontFamily: Fonts.mono, fontSize: 7, color: Colors.muted, letterSpacing: 0.5 },

  utilBtn:     { width: 44, height: 44, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  utilBtnText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.muted, letterSpacing: 1 },

  // Save modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  saveSheet: {
    backgroundColor: '#0c1628',
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderTopWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12,
  },
  saveHandle:     { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border2, alignSelf: 'center', marginBottom: 20 },
  saveTitle:      { fontFamily: Fonts.orbitron, fontSize: 14, color: Colors.text, letterSpacing: 1, marginBottom: 20 },
  saveFieldLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  saveInput: {
    fontFamily: Fonts.rajdhani, fontSize: 16, color: Colors.text,
    borderBottomWidth: 1, borderBottomColor: Colors.cyan,
    paddingVertical: 8, marginBottom: 20,
  },
  saveInputMulti: {
    borderBottomWidth: 0, borderWidth: 1, borderColor: Colors.cyan,
    borderRadius: Radius.sm, paddingHorizontal: 10, height: 72,
    textAlignVertical: 'top',
  },
  catRow:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  catBtn:        { paddingHorizontal: 14, paddingVertical: 9, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border },
  catBtnActive:  { borderColor: `${Colors.cyan}88`, backgroundColor: 'rgba(0,212,255,0.08)' },
  catBtnText:    { fontFamily: Fonts.mono, fontSize: 9, color: Colors.muted, letterSpacing: 1 },
  confirmSaveBtn:     { backgroundColor: Colors.cyan, borderRadius: Radius.md, paddingVertical: 16, alignItems: 'center' },
  confirmSaveBtnText: { fontFamily: Fonts.orbitron, fontSize: 12, color: '#000', letterSpacing: 1 },

  shapePicker: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(4,8,18,0.98)', borderTopWidth: 1, borderTopColor: Colors.border,
  },
  shapeBtn: {
    width: 44, height: 44, borderRadius: Radius.md, borderWidth: 1,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  shapeBtnActive: { borderColor: `${Colors.red}88`, backgroundColor: 'rgba(231,76,60,0.1)' },
  shapeBtnIcon:   { fontSize: 20, color: Colors.muted },
  sportBallIcon:  { fontSize: 11 },
});
