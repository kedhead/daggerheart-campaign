import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, RoundedBox, MeshTransmissionMaterial, Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import './Dice3DOverlay.css';

// Dice face configurations for proper numbering
const DICE_FACES = {
  d4: [1, 2, 3, 4],
  d6: [1, 2, 3, 4, 5, 6],
  d8: [1, 2, 3, 4, 5, 6, 7, 8],
  d10: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
  d12: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  d20: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
};

// Single 3D Die component
function Die3D({
  dieType = 'd12',
  result,
  position = [0, 0, 0],
  color = '#ffffff',
  glowColor = '#ffffff',
  isHope = false,
  isFear = false,
  delay = 0,
  onRollComplete
}) {
  const meshRef = useRef();
  const [phase, setPhase] = useState('waiting'); // waiting, rolling, settling, done
  const [currentRotation, setCurrentRotation] = useState({ x: 0, y: 0, z: 0 });
  const [currentPosition, setCurrentPosition] = useState([position[0], 5, position[2]]);
  const velocityRef = useRef({ x: 0, y: 0, z: 0, vy: 0 });
  const bounceCountRef = useRef(0);

  // Start rolling after delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('rolling');
      velocityRef.current = {
        x: (Math.random() - 0.5) * 15,
        y: (Math.random() - 0.5) * 15,
        z: (Math.random() - 0.5) * 15,
        vy: -0.3
      };
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // Animation frame
  useFrame((state, delta) => {
    if (!meshRef.current) return;

    if (phase === 'rolling') {
      // Update rotation
      const newRotation = {
        x: currentRotation.x + velocityRef.current.x * delta,
        y: currentRotation.y + velocityRef.current.y * delta,
        z: currentRotation.z + velocityRef.current.z * delta
      };
      setCurrentRotation(newRotation);
      meshRef.current.rotation.set(newRotation.x, newRotation.y, newRotation.z);

      // Gravity and bounce
      velocityRef.current.vy += 20 * delta; // gravity
      const newY = currentPosition[1] - velocityRef.current.vy * delta;

      if (newY <= 0.5) {
        // Bounce
        bounceCountRef.current++;
        velocityRef.current.vy *= -0.5;
        velocityRef.current.x *= 0.7;
        velocityRef.current.y *= 0.7;
        velocityRef.current.z *= 0.7;

        if (bounceCountRef.current >= 3 || Math.abs(velocityRef.current.vy) < 0.5) {
          setPhase('settling');
        }
        setCurrentPosition([currentPosition[0], 0.5, currentPosition[2]]);
      } else {
        setCurrentPosition([currentPosition[0], newY, currentPosition[2]]);
      }

      meshRef.current.position.set(currentPosition[0], currentPosition[1], currentPosition[2]);
    } else if (phase === 'settling') {
      // Dampen rotation to final position
      velocityRef.current.x *= 0.9;
      velocityRef.current.y *= 0.9;
      velocityRef.current.z *= 0.9;

      const newRotation = {
        x: currentRotation.x + velocityRef.current.x * delta,
        y: currentRotation.y + velocityRef.current.y * delta,
        z: currentRotation.z + velocityRef.current.z * delta
      };
      setCurrentRotation(newRotation);
      meshRef.current.rotation.set(newRotation.x, newRotation.y, newRotation.z);

      if (Math.abs(velocityRef.current.x) < 0.1 &&
          Math.abs(velocityRef.current.y) < 0.1 &&
          Math.abs(velocityRef.current.z) < 0.1) {
        setPhase('done');
        if (onRollComplete) onRollComplete();
      }
    } else if (phase === 'done') {
      // Gentle floating effect when done
      meshRef.current.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
    }
  });

  // Determine die geometry based on type
  const getDieGeometry = () => {
    switch (dieType) {
      case 'd4':
        return <tetrahedronGeometry args={[0.8]} />;
      case 'd6':
        return <boxGeometry args={[1, 1, 1]} />;
      case 'd8':
        return <octahedronGeometry args={[0.8]} />;
      case 'd10':
      case 'd12':
        return <dodecahedronGeometry args={[0.7]} />;
      case 'd20':
        return <icosahedronGeometry args={[0.75]} />;
      default:
        return <dodecahedronGeometry args={[0.7]} />;
    }
  };

  const emissiveIntensity = phase === 'done' ? 0.5 : 0.1;
  const actualGlowColor = isHope ? '#fbbf24' : isFear ? '#a855f7' : glowColor;

  return (
    <group>
      <mesh
        ref={meshRef}
        position={currentPosition}
        castShadow
      >
        {getDieGeometry()}
        <meshStandardMaterial
          color={color}
          emissive={actualGlowColor}
          emissiveIntensity={emissiveIntensity}
          metalness={0.3}
          roughness={0.4}
        />
      </mesh>

      {/* Glow effect when done */}
      {phase === 'done' && (
        <pointLight
          position={[currentPosition[0], currentPosition[1] + 0.5, currentPosition[2]]}
          color={actualGlowColor}
          intensity={2}
          distance={3}
        />
      )}
    </group>
  );
}

// Result display that shows after dice settle
function ResultDisplay({ result, isHope, isFear, show }) {
  const [scale, setScale] = useState(0);

  useEffect(() => {
    if (show) {
      // Animate scale up
      const interval = setInterval(() => {
        setScale(prev => Math.min(prev + 0.1, 1));
      }, 16);
      return () => clearInterval(interval);
    }
  }, [show]);

  if (!show) return null;

  const color = isHope ? '#fbbf24' : isFear ? '#a855f7' : '#ffffff';
  const label = isHope ? 'HOPE' : isFear ? 'FEAR' : '';

  return (
    <group scale={[scale, scale, scale]}>
      <Text
        position={[0, 2.5, 0]}
        fontSize={1.5}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#000000"
      >
        {result}
      </Text>
      {label && (
        <Text
          position={[0, 1.2, 0]}
          fontSize={0.5}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#000000"
        >
          {label}
        </Text>
      )}
    </group>
  );
}

// Particle burst effect
function ParticleBurst({ trigger, color = '#fbbf24', count = 50 }) {
  const particles = useRef();
  const [positions, setPositions] = useState([]);
  const [velocities, setVelocities] = useState([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      // Create particle burst
      const newPositions = [];
      const newVelocities = [];
      for (let i = 0; i < count; i++) {
        newPositions.push(0, 0.5, 0);
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 3;
        const ySpeed = 2 + Math.random() * 4;
        newVelocities.push(
          Math.cos(angle) * speed,
          ySpeed,
          Math.sin(angle) * speed
        );
      }
      setPositions(newPositions);
      setVelocities(newVelocities);
      setVisible(true);

      // Hide after animation
      setTimeout(() => setVisible(false), 2000);
    }
  }, [trigger, count]);

  useFrame((state, delta) => {
    if (!visible || !particles.current) return;

    const pos = particles.current.geometry.attributes.position;
    const newPositions = [...positions];

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      newPositions[i3] += velocities[i3] * delta;
      newPositions[i3 + 1] += velocities[i3 + 1] * delta - 9.8 * delta * delta;
      newPositions[i3 + 2] += velocities[i3 + 2] * delta;
    }

    setPositions(newPositions);
    pos.array = new Float32Array(newPositions);
    pos.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <points ref={particles}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={new Float32Array(positions)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color={color}
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

// Camera shake effect
function CameraShake({ trigger, intensity = 0.3, duration = 500 }) {
  const { camera } = useThree();
  const originalPosition = useRef(camera.position.clone());
  const shaking = useRef(false);
  const startTime = useRef(0);

  useEffect(() => {
    if (trigger) {
      shaking.current = true;
      startTime.current = Date.now();
      originalPosition.current = camera.position.clone();
    }
  }, [trigger, camera]);

  useFrame(() => {
    if (!shaking.current) return;

    const elapsed = Date.now() - startTime.current;
    if (elapsed > duration) {
      camera.position.copy(originalPosition.current);
      shaking.current = false;
      return;
    }

    const progress = elapsed / duration;
    const decay = 1 - progress;
    const shake = intensity * decay;

    camera.position.x = originalPosition.current.x + (Math.random() - 0.5) * shake;
    camera.position.y = originalPosition.current.y + (Math.random() - 0.5) * shake;
  });

  return null;
}

// Main scene
function DiceScene({ rollData, onComplete }) {
  const [showResults, setShowResults] = useState(false);
  const [particleTrigger, setParticleTrigger] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const diceCompleted = useRef(0);
  const totalDice = rollData.dice?.length || 2; // Default to 2 for hope/fear

  const handleDieComplete = () => {
    diceCompleted.current++;
    if (diceCompleted.current >= totalDice) {
      // All dice settled - show results with effects
      setTimeout(() => {
        setShowResults(true);
        setParticleTrigger(true);
        setShakeTrigger(true);

        // Notify parent after display
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 2000);
      }, 300);
    }
  };

  // Determine what dice to render
  const diceToRender = useMemo(() => {
    if (rollData.system === 'daggerheart') {
      return [
        {
          type: 'd12',
          result: rollData.hopeDie,
          position: [-1.2, 0, 0],
          isHope: true,
          color: '#fef3c7',
          glowColor: '#fbbf24'
        },
        {
          type: 'd12',
          result: rollData.fearDie,
          position: [1.2, 0, 0],
          isFear: true,
          color: '#ede9fe',
          glowColor: '#a855f7'
        }
      ];
    } else if (rollData.system === 'generic' && rollData.rolls) {
      return rollData.rolls.map((result, i) => ({
        type: `d${rollData.dieType}`,
        result,
        position: [(i - (rollData.rolls.length - 1) / 2) * 1.5, 0, 0],
        color: '#e0f2fe',
        glowColor: '#3b82f6'
      }));
    } else if (rollData.system === 'dnd5e') {
      const dice = [{
        type: 'd20',
        result: rollData.d20,
        position: [0, 0, 0],
        color: rollData.isCrit ? '#fef3c7' : rollData.isCritFail ? '#fee2e2' : '#e0f2fe',
        glowColor: rollData.isCrit ? '#fbbf24' : rollData.isCritFail ? '#ef4444' : '#3b82f6'
      }];
      if (rollData.d20Second !== undefined) {
        dice[0].position = [-1, 0, 0];
        dice.push({
          type: 'd20',
          result: rollData.d20Second,
          position: [1, 0, 0],
          color: '#e0f2fe',
          glowColor: '#3b82f6'
        });
      }
      return dice;
    }
    return [];
  }, [rollData]);

  const particleColor = rollData.outcome === 'hope' ? '#fbbf24' :
                        rollData.outcome === 'fear' ? '#a855f7' :
                        '#3b82f6';

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#8b5cf6" />

      {/* Floor/surface */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.5} />
      </mesh>

      {/* Dice */}
      {diceToRender.map((die, index) => (
        <Die3D
          key={index}
          dieType={die.type}
          result={die.result}
          position={die.position}
          color={die.color}
          glowColor={die.glowColor}
          isHope={die.isHope}
          isFear={die.isFear}
          delay={index * 100}
          onRollComplete={handleDieComplete}
        />
      ))}

      {/* Sparkles background */}
      <Sparkles
        count={100}
        scale={10}
        size={2}
        speed={0.3}
        color={particleColor}
        opacity={0.5}
      />

      {/* Result display */}
      {rollData.system === 'daggerheart' && (
        <>
          <ResultDisplay
            result={rollData.hopeDie}
            isHope={true}
            show={showResults}
          />
          <group position={[2.5, 0, 0]}>
            <ResultDisplay
              result={rollData.fearDie}
              isFear={true}
              show={showResults}
            />
          </group>
        </>
      )}

      {/* Particle burst on result */}
      <ParticleBurst trigger={particleTrigger} color={particleColor} count={80} />

      {/* Camera shake */}
      <CameraShake trigger={shakeTrigger} intensity={0.2} />
    </>
  );
}

// Main overlay component
export default function Dice3DOverlay({
  show,
  rollData,
  onComplete,
  onClose
}) {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    if (show) {
      setAnimationComplete(false);
    }
  }, [show]);

  const handleComplete = () => {
    setAnimationComplete(true);
    // Auto-close after showing result
    setTimeout(() => {
      if (onComplete) onComplete();
      if (onClose) onClose();
    }, 1500);
  };

  if (!show || !rollData) return null;

  const outcomeClass = rollData.outcome ||
    (rollData.isCrit ? 'crit' : '') ||
    (rollData.isCritFail ? 'critfail' : '');

  return (
    <div className={`dice-3d-overlay ${outcomeClass}`} onClick={animationComplete ? onClose : undefined}>
      <div className="dice-3d-container">
        <Canvas
          shadows
          camera={{ position: [0, 5, 8], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            <DiceScene rollData={rollData} onComplete={handleComplete} />
          </Suspense>
        </Canvas>
      </div>

      {/* Result banner */}
      {animationComplete && (
        <div className={`dice-result-banner ${outcomeClass}`}>
          <div className="result-total">{rollData.total}</div>
          {rollData.outcome && (
            <div className={`result-outcome ${rollData.outcome}`}>
              {rollData.outcome === 'hope' ? '✨ WITH HOPE' : '💀 WITH FEAR'}
            </div>
          )}
          {rollData.isCrit && <div className="result-outcome crit">⚔️ CRITICAL HIT!</div>}
          {rollData.isCritFail && <div className="result-outcome critfail">💥 CRITICAL FAIL!</div>}
          <div className="result-hint">Click anywhere to close</div>
        </div>
      )}

      {/* Skip button */}
      {!animationComplete && (
        <button className="dice-skip-btn" onClick={handleComplete}>
          Skip Animation
        </button>
      )}
    </div>
  );
}
