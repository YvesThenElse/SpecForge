import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Vanta effects will be loaded dynamically
declare global {
  interface Window {
    VANTA: any;
  }
}

export type VantaEffect = 'none' | 'cells';

interface VantaBackgroundProps {
  effect: VantaEffect;
  color?: string;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ effect, color = '#4CAF50' }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    if (!vantaRef.current || effect === 'none') {
      if (vantaEffect) {
        vantaEffect.destroy();
        setVantaEffect(null);
      }
      return;
    }

    const loadVantaEffect = async () => {
      // Cleanup previous effect
      if (vantaEffect) {
        vantaEffect.destroy();
      }

      // Load the Cells effect
      try {
        if (effect === 'cells') {
          const VantaEffect = (await import('vanta/dist/vanta.cells.min')).default;

          if (VantaEffect && vantaRef.current) {
            const newEffect = VantaEffect({
              el: vantaRef.current,
              THREE: THREE,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              color: color,
              size: 1.5,
              speed: 1.0
            });
            setVantaEffect(newEffect);
          }
        }
      } catch (error) {
        console.error('Failed to load Vanta effect:', error);
      }
    };

    loadVantaEffect();

    return () => {
      if (vantaEffect) {
        vantaEffect.destroy();
      }
    };
  }, [effect, color]);

  if (effect === 'none') {
    return null;
  }

  return (
    <div
      ref={vantaRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
};

export default VantaBackground;
