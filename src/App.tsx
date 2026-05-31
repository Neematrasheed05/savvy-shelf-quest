import React, { useState, useEffect, useRef, Suspense, useMemo, createContext, useContext } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { 
  Environment, 
  Text, 
  Sparkles, 
  Stars, 
  RoundedBox, 
  PerspectiveCamera, 
  ContactShadows,
  useCursor,
  BakeShadows,
  Html
} from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { Howl } from 'howler';
import { 
  ShoppingBasket, 
  Trophy, 
  Timer, 
  Star, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Play, 
  Info,
  ShoppingCart,
  SkipForward,
  Check,
  X,
  Keyboard,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ChevronRight,
  Plus,
  Zap,
  Loader2
} from 'lucide-react';
import * as THREE from 'three';

// --- Context for Avatar Proximity ---
const AvatarContext = createContext<React.MutableRefObject<THREE.Vector3> | null>(null);

// --- Types & Data ---
type GameState = 'loading' | 'intro' | 'menu' | 'instructions' | 'playing' | 'finished';

type ProductData = {
  id: string;
  name: string;
  brand: string;
  category: 'Drinks' | 'Chocolate' | 'Snacks' | 'Personal Care' | 'Household';
  isAlternative: boolean;
  color: string;
  fact?: string;
  description: string;
  boycottReason?: string;
  alternativeSuggestion?: string;
};

type CartItem = {
  productId: string;
  productName: string;
  brand: string;
  color: string;
  quantity: number;
};

const PRODUCTS: ProductData[] = [
  // --- Soft Drinks ('Drinks') ---
  { id: 'sd1', name: 'Cola Classic', brand: 'Coca-Cola', category: 'Drinks', isAlternative: false, color: '#ef4444', description: 'Popular carbonated soft drink.', boycottReason: 'This brand is currently under boycott for ethical concerns.', alternativeSuggestion: 'Brava Cola' },
  { id: 'sd2', name: 'Brava Cola', brand: 'Brava', category: 'Drinks', isAlternative: true, color: '#1e40af', description: 'Local Kenyan cola with a refreshing taste.', fact: 'Brava Cola is manufactured locally in Kenya!' },
  { id: 'sd3', name: 'Orange Soda', brand: 'Fanta Orange', category: 'Drinks', isAlternative: false, color: '#f97316', description: 'Bright orange carbonated drink.', boycottReason: 'This brand is part of a global boycott list.', alternativeSuggestion: 'Brava Orange' },
  { id: 'sd4', name: 'Brava Orange', brand: 'Brava', category: 'Drinks', isAlternative: true, color: '#ea580c', description: 'Local citrus blast made in Kenya.', fact: 'Support local jobs by choosing Brava!' },
  { id: 'sd5', name: 'Lemon Lime', brand: 'Sprite', category: 'Drinks', isAlternative: false, color: '#22c55e', description: 'Crisp lemon-lime soda.', boycottReason: 'Ethical concerns regarding parent company.', alternativeSuggestion: 'Krest Lemon & Lime' },
  { id: 'sd6', name: 'Krest L&L', brand: 'Krest', category: 'Drinks', isAlternative: true, color: '#166534', description: 'Trusted local lemon and lime refreshment.', fact: 'Krest is a beloved regional alternative.' },
  { id: 'sd7', name: 'Minute Maid', brand: 'Minute Maid', category: 'Drinks', isAlternative: false, color: '#facc15', description: 'Fruit juice beverage.', boycottReason: 'Boycott for global environmental impact.', alternativeSuggestion: 'Pick N Peel Juice' },
  { id: 'sd8', name: 'Pick N Peel', brand: 'Pick N Peel', category: 'Drinks', isAlternative: true, color: '#ca8a04', description: 'Premium 100% juice made in Kenya.', fact: 'Pick N Peel uses real fruit grown by local farmers.' },

  // --- Chocolate & Sweets ('Chocolate') ---
  { id: 'cs1', name: 'Wafer Bar', brand: 'KitKat', category: 'Chocolate', isAlternative: false, color: '#dc2626', description: 'Chocolate-coated wafer fingers.', boycottReason: 'Linked to supply chain labor issues.', alternativeSuggestion: 'Tropical Heat Chocolate Wafer' },
  { id: 'cs2', name: 'TH Wafer', brand: 'Tropical Heat', category: 'Chocolate', isAlternative: true, color: '#b91c1c', description: 'Crunchy local wafer dipped in chocolate.', fact: 'Tropical Heat is a famous Kenyan snack brand.' },
  { id: 'cs3', name: 'Dairy Milk', brand: 'Cadbury', category: 'Chocolate', isAlternative: false, color: '#4c1d95', description: 'Classic milk chocolate bar.', boycottReason: 'Parent company listed in ethical boycott guides.', alternativeSuggestion: 'Kenyan-made Chocolate' },
  { id: 'cs4', name: 'Kenya Choc', brand: 'Local Brand', category: 'Chocolate', isAlternative: true, color: '#5b21b6', description: 'Rich chocolate produced by Kenyan artisans.', fact: 'Kenyan chocolate uses high-quality African cocoa.' },

  // --- Biscuits & Snacks ('Snacks') ---
  { id: 'sn1', name: 'Black Cookie', brand: 'Oreo', category: 'Snacks', isAlternative: false, color: '#1e3a8a', description: 'Cream-filled chocolate cookies.', boycottReason: 'Issues with unsustainable palm oil sourcing.', alternativeSuggestion: 'Britannia Bourbon' },
  { id: 'sn2', name: 'Bourbon', brand: 'Britannia', category: 'Snacks', isAlternative: true, color: '#7f1d1d', description: 'Classic chocolate cream sandwich biscuits.', fact: 'Bourbon biscuits are a delicious and ethical choice.' },
  { id: 'sn3', name: 'Tube Crisps', brand: 'Pringles', category: 'Snacks', isAlternative: false, color: '#ef4444', description: 'Stacked potato crisps.', boycottReason: 'Excessive non-recyclable packaging and sourcing.', alternativeSuggestion: 'Tropical Heat Crisps' },
  { id: 'sn4', name: 'TH Crisps', brand: 'Tropical Heat', category: 'Snacks', isAlternative: true, color: '#f59e0b', description: 'Crunchy potato crisps from Kenya.', fact: 'Tropical Heat supports local potato agriculture.' },
  { id: 'sn5', name: 'Corn Snacks', brand: 'Cheetos', category: 'Snacks', isAlternative: false, color: '#f97316', description: 'Cheese-flavored puffed snacks.', boycottReason: 'Company involvement in unethical trade.', alternativeSuggestion: 'Tropical Heat Cheese Snacks' },
  { id: 'sn6', name: 'TH Cheese', brand: 'Tropical Heat', category: 'Snacks', isAlternative: true, color: '#d97706', description: 'Deliciously cheesy local puffs.', fact: 'Cheesy puffs made right here in the region.' },

  // --- Personal Care ('Personal Care') ---
  { id: 'pc1', name: 'Toothpaste', brand: 'Colgate', category: 'Personal Care', isAlternative: false, color: '#ef4444', description: 'Fluoride toothpaste for oral health.', boycottReason: 'Ethical concerns regarding testing and labor.', alternativeSuggestion: 'Aquafresh' },
  { id: 'pc2', name: 'Aquafresh', brand: 'Aquafresh', category: 'Personal Care', isAlternative: true, color: '#3b82f6', description: 'Triple protection toothpaste.', fact: 'Aquafresh is a widely supported alternative.' },
  { id: 'pc3', name: 'Beauty Bar', brand: 'Dove', category: 'Personal Care', isAlternative: false, color: '#f8fafc', description: 'Moisturizing skin cleanser.', boycottReason: 'Critically listed for greenwashing by ethical groups.', alternativeSuggestion: 'Menengai Soap' },
  { id: 'pc4', name: 'Menengai', brand: 'Menengai', category: 'Personal Care', isAlternative: true, color: '#cbd5e1', description: 'Traditional Kenyan multi-purpose soap.', fact: 'Menengai soap has been a Kenyan household staple for decades.' },

  // --- Household ('Household') ---
  { id: 'hh1', name: 'Detergent', brand: 'Ariel', category: 'Household', isAlternative: false, color: '#16a34a', description: 'Powerful laundry detergent.', boycottReason: 'Target of boycott for unethical corporate policies.', alternativeSuggestion: 'White Wash' },
  { id: 'hh2', name: 'White Wash', brand: 'White Wash', category: 'Household', isAlternative: true, color: '#22c55e', description: 'Strong local detergent for bright clothes.', fact: 'White Wash is highly effective and locally produced.' },
  { id: 'hh3', name: 'Dish Liquid', brand: 'Fairy', category: 'Household', isAlternative: false, color: '#facc15', description: 'Tough on grease dishwashing liquid.', boycottReason: 'Listed for environmental and social concerns.', alternativeSuggestion: 'Axion' },
  { id: 'hh4', name: 'Axion', brand: 'Axion', category: 'Household', isAlternative: true, color: '#15803d', description: 'Powerful grease-cutting dish paste/liquid.', fact: 'Axion is the trusted choice for Kenyan kitchens.' },
];

const MISSIONS = [
  { category: 'Drinks', text: 'Find a Kenyan alternative to Coca-Cola' },
  { category: 'Snacks', text: 'Pick Tropical Heat instead of Pringles' },
  { category: 'Personal Care', text: 'Locate Aquafresh Toothpaste' },
  { category: 'Household', text: 'Choose Axion for your dishes' },
  { category: 'Chocolate', text: 'Select a Tropical Heat Chocolate Wafer' },
];

// --- Audio ---
const SOUNDS = {
  bgm: new Howl({ src: ['https://assets.mixkit.co/music/preview/mixkit-shopping-spree-611.mp3'], loop: true, volume: 0.2, html5: true }),
  correct: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-achievement-bell-600.mp3'], volume: 0.5 }),
  wrong: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-untrustworthy-slap-stick-2415.mp3'], volume: 0.3 }),
  pop: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-positive-interface-click-1112.mp3'], volume: 0.4 }),
  click: new Howl({ src: ['https://assets.mixkit.co/sfx/preview/mixkit-modern-click-box-check-1120.mp3'], volume: 0.4 }),
};

const SoundControl = {
  play: (key: keyof typeof SOUNDS) => { try { SOUNDS[key].play(); } catch(e){} },
  stop: (key: keyof typeof SOUNDS) => { try { SOUNDS[key].stop(); } catch(e){} },
  mute: (m: boolean) => { Object.values(SOUNDS).forEach(s => s.mute(m)); }
};

// --- 3D World ---

function RobloxAvatar({ movement, isPlaying }: { movement: { x: number, z: number }, isPlaying: boolean }) {
  const group = useRef<THREE.Group>(null);
  const velocity = useRef({ x: 0, z: 0 });
  const avatarPosRef = useContext(AvatarContext);

  useFrame((state, delta) => {
    if (!group.current || !isPlaying) return;
    
    const speed = 14;
    const lerp = 0.12;
    
    velocity.current.x = THREE.MathUtils.lerp(velocity.current.x, movement.x * speed, lerp);
    velocity.current.z = THREE.MathUtils.lerp(velocity.current.z, movement.z * speed, lerp);

    group.current.position.x += velocity.current.x * delta;
    group.current.position.z += velocity.current.z * delta;

    group.current.position.x = Math.max(-15, Math.min(15, group.current.position.x));
    group.current.position.z = Math.max(-25, Math.min(35, group.current.position.z));

    if (avatarPosRef) avatarPosRef.current.copy(group.current.position);

    const moving = Math.abs(velocity.current.x) > 0.1 || Math.abs(velocity.current.z) > 0.1;
    if (moving) {
      group.current.rotation.y = Math.atan2(velocity.current.x, velocity.current.z);
      const legs = group.current.getObjectByName('legs');
      if (legs) {
        legs.children[0].rotation.x = Math.sin(state.clock.elapsedTime * 12) * 0.4;
        legs.children[1].rotation.x = Math.sin(state.clock.elapsedTime * 12 + Math.PI) * 0.4;
      }
    }

    state.camera.position.lerp(new THREE.Vector3(group.current.position.x, 12, group.current.position.z + 16), 0.1);
    state.camera.lookAt(group.current.position.x, 0, group.current.position.z);
  });

  return (
    <group ref={group} position={[0, 0, 18]}>
      <mesh castShadow position={[0, 1, 0]}>
        <boxGeometry args={[0.9, 1.2, 0.4]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      <mesh castShadow position={[0, 1.9, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#fcd34d" />
      </mesh>
      <group name="legs">
        <mesh castShadow position={[-0.22, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.8, 0.4]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
        <mesh castShadow position={[0.22, 0.4, 0]}>
          <boxGeometry args={[0.4, 0.8, 0.4]} />
          <meshStandardMaterial color="#1e3a8a" />
        </mesh>
      </group>
    </group>
  );
}

function Supermarket({ onInspect, onSelection, activeCategory, state }: any) {
  const aisles = useMemo(() => [
    { name: 'Drinks', z: -18 },
    { name: 'Chocolate', z: -6 },
    { name: 'Snacks', z: 6 },
    { name: 'Personal Care', z: 18 },
    { name: 'Household', z: 30 },
  ], []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.05, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>
      <ambientLight intensity={0.7} />
      <directionalLight position={[15, 30, 15]} intensity={1.5} castShadow />
      
      {aisles.map((aisle) => (
        <group key={aisle.name} position={[0, 0, aisle.z]}>
          <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
            <boxGeometry args={[24, 1.6, 4]} />
            <meshStandardMaterial color="#f1f5f9" />
          </mesh>
          <Text position={[0, 5, 0]} fontSize={0.6} color="#1e293b">
            {aisle.name}
          </Text>
          {PRODUCTS.filter(p => p.category === aisle.name).map((p, i) => (
            <Product 
              key={p.id} 
              data={p} 
              position={[-9 + i * 6, 1.6, 1.8]} 
              onInspect={onInspect}
              onSelection={onSelection}
              isTarget={activeCategory === p.category && state === 'playing'}
              gameState={state}
            />
          ))}
        </group>
      ))}
      <Environment preset="city" />
      <ContactShadows position={[0, 0, 0]} opacity={0.3} scale={60} blur={2} far={10} />
      <BakeShadows />
    </group>
  );
}

function Product({ data, position, onInspect, onSelection, isTarget, gameState }: any) {
  const [hovered, setHover] = useState(false);
  const [isProximate, setIsProximate] = useState(false);
  const avatarPosRef = useContext(AvatarContext);
  const worldPos = useMemo(() => new THREE.Vector3(...position), [position]);
  
  useFrame(() => {
    if (!avatarPosRef || gameState !== 'playing') return;
    const distance = avatarPosRef.current.distanceTo(worldPos);
    const close = distance < 5.5;
    if (close !== isProximate) setIsProximate(close);
  });

  const showButtons = (hovered || isProximate) && gameState === 'playing';
  useCursor(hovered && gameState === 'playing');

  return (
    <group position={position} onPointerOver={() => setHover(true)} onPointerOut={() => setHover(false)} onClick={() => onInspect(data)}>
      <RoundedBox args={[1.5, 2, 0.5]} radius={0.08} castShadow>
        <meshStandardMaterial color={data.color} emissive={showButtons ? data.color : '#000000'} emissiveIntensity={showButtons ? 0.3 : 0} />
      </RoundedBox>
      <Text position={[0, 0, 0.26]} fontSize={0.2} color="white" maxWidth={1.4} textAlign="center">
        {data.brand}
      </Text>

      <AnimatePresence>
        {showButtons && (
          <Html position={[0, -1.8, 0]} center distanceFactor={12}>
            <motion.div initial={{ opacity: 0, scale: 0.8, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 10 }} className="flex flex-col gap-2">
              <button onClick={(e) => { e.stopPropagation(); onSelection(data); }} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black text-xs shadow-2xl border-2 border-green-400 flex items-center gap-2 hover:scale-105 active:scale-95 transition-transform">
                CHOOSE <Plus className="w-4 h-4" />
              </button>
            </motion.div>
          </Html>
        )}
      </AnimatePresence>

      {isTarget && (
        <>
          <Sparkles count={15} scale={2} size={6} speed={2} color={data.isAlternative ? "#22c55e" : "#ef4444"} />
          <mesh scale={[1.1, 1.15, 1.1]}>
            <boxGeometry args={[1.5, 2, 0.5]} />
            <meshBasicMaterial color={data.isAlternative ? "#22c55e" : "#ef4444"} wireframe transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
}

// --- Components ---

const CartView = ({ items, onRemove, onClose, isLoading }: { items: CartItem[], onRemove: (id: string) => void, onClose: () => void, isLoading: boolean }) => {
  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/60 backdrop-blur flex items-center justify-center p-4">
      <motion.div initial={{ y: 100 }} animate={{ y: 0 }} className="bg-white w-full max-w-md rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
        <div className="p-8 border-b flex justify-between items-center bg-slate-50">
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">BASKET</h2>
           <button onClick={onClose} className="p-4 bg-white border border-slate-200 rounded-full hover:bg-slate-100 transition"><X className="w-6 h-6 text-slate-900" /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col gap-4 py-4 animate-pulse">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center gap-4 bg-slate-100 p-5 rounded-3xl h-20 w-full" />
               ))}
               <div className="flex items-center justify-center py-10">
                 <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
               </div>
            </div>
          ) : items.length === 0 ? (
            <div className="py-20 text-center opacity-30">
               <ShoppingCart className="w-20 h-20 mx-auto mb-4" />
               <p className="text-xl font-black uppercase">Your basket is empty</p>
            </div>
          ) : (
            items.map(item => (
              <div key={item.productId} className="flex items-center gap-4 bg-slate-50 p-5 rounded-3xl border border-slate-100">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-black" style={{ backgroundColor: item.color }}>{item.brand[0]}</div>
                <div className="flex-1">
                  <h4 className="font-black text-slate-900 uppercase">{item.productName}</h4>
                  <p className="text-xs font-bold text-slate-400">{item.brand}</p>
                </div>
                <div className="font-black text-slate-900">x{item.quantity}</div>
                <button onClick={() => onRemove(item.productId)} className="p-2 text-red-500 hover:bg-red-50 rounded-full"><X className="w-5 h-5" /></button>
              </div>
            ))
          )}
        </div>
        <div className="p-8 bg-slate-50">
          <button onClick={onClose} className="w-full bg-green-600 text-white py-6 rounded-[2rem] font-black text-xl shadow-xl active:scale-95 transition-all">BACK TO STORE</button>
        </div>
      </motion.div>
    </div>
  );
};

const HUD = ({ score, timer, mission, progress, isMuted, toggleMute, feedback, cartCount, onCartClick }: any) => {
  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-20 font-sans">
      <div className="flex justify-between items-start pointer-events-auto">
        <div className="bg-white/95 backdrop-blur rounded-[2rem] p-3 shadow-xl border-2 border-green-500 flex gap-6 items-center">
          <div className="flex flex-col items-center">
            <Trophy className="w-5 h-5 text-green-600 mb-0.5" />
            <span className="text-xl font-black text-slate-900">{score}</span>
          </div>
          <div className="flex flex-col items-center border-l pl-6 pr-2">
            <Timer className={`w-5 h-5 mb-0.5 ${timer < 30 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`} />
            <span className="text-xl font-black text-slate-900">{Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={onCartClick} className="relative bg-white p-4 rounded-full shadow-xl border-2 border-slate-100 transition-transform active:scale-90">
            <ShoppingCart className="w-6 h-6 text-slate-900" />
            {cartCount > 0 && (
              <div className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                {cartCount}
              </div>
            )}
          </button>
          <button onClick={toggleMute} className="bg-white p-4 rounded-full shadow-xl">
            {isMuted ? <VolumeX className="w-6 h-6 text-slate-300" /> : <Volume2 className="w-6 h-6 text-green-600" />}
          </button>
        </div>
      </div>
      <div className="flex flex-col items-center mb-6">
        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} className="bg-white/95 backdrop-blur px-8 py-4 rounded-[2.5rem] shadow-xl border-b-8 border-green-600 border-x-2 border-t-2 border-slate-100 text-center">
          <div className="text-[10px] font-black uppercase text-green-600 tracking-[0.2em] mb-1">Current Mission</div>
          <h2 className="text-xl font-black text-slate-900 leading-tight mb-3">{mission}</h2>
          <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden border">
            <motion.div className="h-full bg-green-500" animate={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <AnimatePresence>
          {feedback && (
            <motion.div initial={{ scale: 0, rotate: -15 }} animate={{ scale: 1.3, rotate: 0 }} exit={{ scale: 0 }} className="p-8 rounded-[3rem] shadow-2xl border-[8px] bg-green-500 border-green-200 text-white text-3xl font-black italic tracking-tighter">
              {feedback.message}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main App Logic ---

export default function App() {
  const avatarPosRef = useRef(new THREE.Vector3());
  const [gameState, setGameState] = useState<GameState>('loading');
  
  const [score, setScore] = useState(() => Number(localStorage.getItem('user_score')) || 0);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('user_cart') || '[]');
    } catch { return []; }
  });

  const [timer, setTimer] = useState(180);
  const [missionIdx, setMissionIdx] = useState(0);
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('muted') === 'true');
  const [movement, setMovement] = useState({ x: 0, z: 0 });
  const [feedback, setFeedback] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null);
  const [boycottProduct, setBoycottProduct] = useState<ProductData | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [isCartLoading, setIsCartLoading] = useState(false);

  const currentMission = MISSIONS[missionIdx];

  // Persistence
  useEffect(() => {
    localStorage.setItem('user_score', String(score));
    localStorage.setItem('user_cart', JSON.stringify(cart));
  }, [score, cart]);

  useEffect(() => {
    if (gameState === 'loading') {
      const t = setTimeout(() => setGameState('intro'), 2500);
      return () => clearTimeout(t);
    }
  }, [gameState]);

  useEffect(() => {
    SoundControl.mute(isMuted);
    if (gameState === 'playing' && !isMuted) SoundControl.play('bgm');
    else if (gameState !== 'playing') SoundControl.stop('bgm');
  }, [gameState, isMuted]);

  useEffect(() => {
    if (gameState !== 'playing' || timer <= 0) {
      if (timer <= 0 && gameState === 'playing') setGameState('finished');
      return;
    }
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [gameState, timer]);

  const onSelectionAction = (p: ProductData) => {
    if (p.boycottReason) {
      setBoycottProduct(p);
      SoundControl.play('wrong');
      return;
    }

    const points = p.isAlternative ? 15 : 5;
    setScore(s => s + points);
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === p.id);
      if (existing) {
        return prev.map(item => item.productId === p.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: p.id, productName: p.name, brand: p.brand, color: p.color, quantity: 1 }];
    });

    if (p.category === currentMission.category && p.isAlternative) {
      SoundControl.play('correct');
      setFeedback({ type: 'success', message: 'SMART CHOICE!' });
      setTimeout(() => {
        setFeedback(null);
        if (missionIdx < MISSIONS.length - 1) setMissionIdx(i => i + 1);
        else setGameState('finished');
      }, 2000);
    } else {
      SoundControl.play('pop');
      setFeedback({ type: 'success', message: 'ADDED!' });
      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleOpenCart = () => {
    setShowCart(true);
    setIsCartLoading(true);
    setTimeout(() => setIsCartLoading(false), 1200); // Simulated fetch
  };

  return (
    <AvatarContext.Provider value={avatarPosRef}>
      <div className="w-full h-screen bg-slate-950 overflow-hidden relative select-none touch-none font-sans">
        
        <div className="absolute inset-0">
          <Canvas shadows>
            <PerspectiveCamera makeDefault position={[0, 15, 30]} fov={50} />
            <Suspense fallback={null}>
              <CinematicCamera state={gameState} onComplete={() => setGameState('menu')} />
              <Supermarket 
                onInspect={(p: ProductData) => setSelectedProduct(p)} 
                onSelection={onSelectionAction}
                activeCategory={currentMission?.category} 
                state={gameState} 
              />
              {(gameState === 'playing' || gameState === 'menu') && (
                <RobloxAvatar movement={movement} isPlaying={gameState === 'playing'} />
              )}
              <Stars radius={100} depth={50} count={2000} factor={4} saturation={0} fade speed={1} />
            </Suspense>
          </Canvas>
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'loading' && (
            <motion.div key="loading" exit={{ opacity: 0 }} className="absolute inset-0 z-[100] bg-green-600 flex flex-col items-center justify-center p-10 text-white">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                <ShoppingCart className="w-24 h-24 mb-6 drop-shadow-xl" />
              </motion.div>
              <h1 className="text-4xl font-black mb-4 tracking-tighter uppercase">Preparing Store...</h1>
              <div className="w-64 h-3 bg-white/20 rounded-full overflow-hidden border border-white/30">
                <motion.div initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ duration: 2.5 }} className="h-full bg-white shadow-[0_0_15px_white]" />
              </div>
            </motion.div>
          )}

          {gameState === 'intro' && (
            <motion.div 
              key="intro-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-end p-10 pointer-events-none"
            >
              <button 
                onClick={() => { SoundControl.play('click'); setGameState('menu'); }}
                className="pointer-events-auto bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-8 py-4 rounded-full border-2 border-white/30 font-black flex items-center gap-3 active:scale-95 transition-all shadow-xl"
              >
                SKIP INTRO <SkipForward className="w-6 h-6" />
              </button>
              <div className="absolute bottom-10 left-10 text-white/40 text-[10vw] font-black italic tracking-tighter leading-none pointer-events-none uppercase">
                Introducing<br/>The Challenge
              </div>
            </motion.div>
          )}

          {gameState === 'menu' && (
            <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
              <motion.div initial={{ scale: 0, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} className="w-56 h-56 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.4)] mb-12 border-[12px] border-green-100">
                <ShoppingCart className="w-28 h-28 text-white" />
              </motion.div>
              <h1 className="text-7xl font-black text-white mb-4 tracking-tighter italic drop-shadow-2xl uppercase leading-none">Shopping Challenge</h1>
              <h2 className="text-4xl font-bold text-green-300 mb-16 uppercase tracking-[0.4em]">Choose Wisely</h2>
              <div className="flex flex-col gap-6 w-full max-w-sm">
                <button onClick={() => { SoundControl.play('click'); setGameState('playing'); }} className="bg-green-600 hover:bg-green-700 text-white py-8 rounded-[3rem] text-4xl font-black shadow-[0_15px_40px_rgba(22,163,74,0.3)] transition-all active:scale-95 flex items-center justify-center gap-4">
                  PLAY NOW <Play className="w-10 h-10 fill-white" />
                </button>
                <button onClick={() => setGameState('instructions')} className="bg-white/10 hover:bg-white/20 text-white py-6 rounded-[3rem] text-2xl font-bold border-4 border-white/20 transition-all flex items-center justify-center gap-3">
                  <Info className="w-8 h-8" /> HOW TO PLAY
                </button>
              </div>
            </motion.div>
          )}

          {gameState === 'instructions' && (
            <motion.div key="how-to" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 z-50 bg-slate-900 flex flex-col items-center justify-center p-6 text-white text-center">
              <h2 className="text-5xl font-black mb-12 text-green-400 italic uppercase">Mission Guide</h2>
              <div className="space-y-6 mb-16 max-w-2xl text-left">
                {[
                  { i: <ShoppingBasket className="text-blue-400 w-10 h-10"/>, t: "Navigate aisles using Joystick or Arrows." },
                  { i: <CheckCircle2 className="text-green-400 w-10 h-10"/>, t: "Identify famous brands and find sustainable alternatives." },
                  { i: <Star className="text-yellow-400 w-10 h-10"/>, t: "Earn more points by picking the ethical choice!" }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-8 items-center bg-white/5 p-8 rounded-[3.5rem] border-2 border-white/10 shadow-xl">
                    {item.i}
                    <p className="text-2xl font-bold leading-tight">{item.t}</p>
                  </div>
                ))}
              </div>
              <button onClick={() => setGameState('menu')} className="bg-green-600 text-white px-20 py-8 rounded-[3rem] text-3xl font-black shadow-2xl active:scale-95 transition-transform">READY TO SHOP</button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <HUD score={score} timer={timer} mission={currentMission.text} progress={(missionIdx / MISSIONS.length) * 100} isMuted={isMuted} toggleMute={() => { const m = !isMuted; setIsMuted(m); localStorage.setItem('muted', String(m)); }} feedback={feedback} cartCount={cart.reduce((a, c) => a + c.quantity, 0)} onCartClick={handleOpenCart} />
          )}

          {gameState === 'finished' && (
            <motion.div key="finish" className="absolute inset-0 z-[200] bg-green-700/95 backdrop-blur flex flex-col items-center justify-center p-6 text-white text-center">
              <Trophy className="w-32 h-32 text-yellow-300 mb-6 drop-shadow-2xl" />
              <h1 className="text-6xl font-black mb-4 italic uppercase">CLEARED!</h1>
              <p className="text-xl font-bold mb-10 opacity-80 uppercase tracking-widest">Score: {score}</p>
              <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="bg-white text-green-700 px-12 py-6 rounded-3xl text-3xl font-black shadow-2xl">RESTART</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cart View with Loading State */}
        <AnimatePresence>
          {showCart && (
            <CartView items={cart} onRemove={(id) => setCart(prev => prev.filter(i => i.productId !== id))} onClose={() => setShowCart(false)} isLoading={isCartLoading} />
          )}
        </AnimatePresence>

        {/* Detail Overlay */}
        <AnimatePresence>
          {selectedProduct && (
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 w-full max-w-md h-full z-[100] bg-white shadow-2xl flex flex-col">
              <div className="h-64 flex items-center justify-center relative overflow-hidden" style={{ backgroundColor: selectedProduct.color }}>
                <button onClick={() => setSelectedProduct(null)} className="absolute top-6 left-6 bg-white/20 p-3 rounded-full text-white"><X /></button>
                <h3 className="text-white text-5xl font-black italic uppercase tracking-tighter text-center">{selectedProduct.brand}</h3>
              </div>
              <div className="flex-1 p-8 flex flex-col">
                <h2 className="text-4xl font-black text-slate-900 uppercase mb-4">{selectedProduct.name}</h2>
                <p className="text-lg text-slate-500 mb-8">{selectedProduct.description}</p>
                <div className="mt-auto">
                  <button onClick={() => { onSelectionAction(selectedProduct); setSelectedProduct(null); }} className="w-full py-6 rounded-3xl text-2xl font-black text-white bg-green-600 shadow-xl">SELECT</button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boycott Modal */}
        <AnimatePresence>
          {boycottProduct && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/90 backdrop-blur p-6">
              <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl text-center border-t-[12px] border-red-600">
                <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
                <h2 className="text-4xl font-black mb-4 uppercase tracking-tighter italic">Boycott Alert</h2>
                <p className="text-xl text-slate-600 mb-8 leading-relaxed">
                  We recommend boycotting <b>{boycottProduct.brand}</b> due to unsustainable business practices.
                </p>
                <div className="bg-green-50 p-6 rounded-3xl border-2 border-green-100 mb-10">
                  <p className="text-green-600 font-black uppercase tracking-widest text-sm mb-2">Better Choice</p>
                  <p className="text-3xl font-black text-green-900 italic">{boycottProduct.alternativeSuggestion}</p>
                </div>
                <button onClick={() => setBoycottProduct(null)} className="bg-slate-900 text-white w-full py-6 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all">UNDERSTOOD</button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Controls */}
        {gameState === 'playing' && (
          <div className="absolute bottom-8 left-8 right-8 z-30 pointer-events-none flex justify-between items-end">
             <div className="pointer-events-auto">
                <Joystick onChange={setMovement} />
             </div>
             <div className="flex flex-col gap-2 pointer-events-auto">
                <div className="flex justify-center">
                   <button onTouchStart={() => setMovement({x:0, z:-1})} onTouchEnd={() => setMovement({x:0,z:0})} className="bg-white/90 p-5 rounded-2xl shadow-xl active:scale-90 transition-transform"><ArrowUp className="w-8 h-8 text-slate-900" /></button>
                </div>
                <div className="flex gap-2">
                   <button onTouchStart={() => setMovement({x:-1, z:0})} onTouchEnd={() => setMovement({x:0,z:0})} className="bg-white/90 p-5 rounded-2xl shadow-xl active:scale-90 transition-transform"><ArrowLeft className="w-8 h-8 text-slate-900" /></button>
                   <button onTouchStart={() => setMovement({x:0, z:1})} onTouchEnd={() => setMovement({x:0,z:0})} className="bg-white/90 p-5 rounded-2xl shadow-xl active:scale-90 transition-transform"><ArrowDown className="w-8 h-8 text-slate-900" /></button>
                   <button onTouchStart={() => setMovement({x:1, z:0})} onTouchEnd={() => setMovement({x:0,z:0})} className="bg-white/90 p-5 rounded-2xl shadow-xl active:scale-90 transition-transform"><ArrowRight className="w-8 h-8 text-slate-900" /></button>
                </div>
             </div>
          </div>
        )}
      </div>
    </AvatarContext.Provider>
  );
}

function Joystick({ onChange }: { onChange: (v: { x: number, z: number }) => void }) {
  const [active, setActive] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const ref = useRef<HTMLDivElement>(null);

  const handle = (x: number, y: number) => {
    if (!active || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    const lim = r.width / 2;
    const amt = Math.min(dist, lim);
    const ang = Math.atan2(dy, dx);
    const lx = Math.cos(ang) * amt;
    const ly = Math.sin(ang) * amt;
    setPos({ x: lx, y: ly });
    onChange({ x: lx / lim, z: ly / lim });
  };

  return (
    <div ref={ref} className="w-40 h-40 bg-white/10 backdrop-blur-xl rounded-full border-4 border-white/30 flex items-center justify-center touch-none shadow-2xl"
      onMouseDown={() => setActive(true)} 
      onTouchStart={() => setActive(true)} 
      onMouseMove={(e) => handle(e.clientX, e.clientY)}
      onMouseUp={() => { setActive(false); setPos({x:0,y:0}); onChange({x:0,z:0}); }}
      onMouseLeave={() => { setActive(false); setPos({x:0,y:0}); onChange({x:0,z:0}); }}
      onTouchMove={(e) => handle(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={() => { setActive(false); setPos({x:0,y:0}); onChange({x:0,z:0}); }}
    >
      <motion.div animate={{ x: pos.x, y: pos.y }} className="w-16 h-16 bg-white rounded-full shadow-2xl border-4 border-slate-50" />
    </div>
  );
}

function CinematicCamera({ state, onComplete }: { state: GameState, onComplete: () => void }) {
  const { camera } = useThree();
  const start = useRef(Date.now());
  const done = useRef(false);
  useFrame(() => {
    if (state !== 'intro') return;
    const elapsed = (Date.now() - start.current) / 1000;
    if (elapsed < 3) {
      camera.position.lerp(new THREE.Vector3(-15, 12, 40), 0.03);
      camera.lookAt(0, 5, 10);
    } else if (elapsed < 6) {
      camera.position.lerp(new THREE.Vector3(20, 8, 0), 0.04);
      camera.lookAt(0, 2, 0);
    } else if (elapsed < 9) {
      camera.position.lerp(new THREE.Vector3(0, 5, 30), 0.05);
      camera.lookAt(0, 3, 10);
    } else {
      if (!done.current) { done.current = true; onComplete(); }
    }
  });
  return null;
}