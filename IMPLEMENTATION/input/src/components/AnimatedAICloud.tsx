import React, { useEffect, useState } from 'react';
import { Box, keyframes } from '@mui/material';
import { styled } from '@mui/material/styles';

interface AnimatedAICloudProps {
  status: 'idle' | 'listening' | 'processing' | 'completed' | 'error';
}

// Keyframes pour les différentes animations
const breathe = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.05); opacity: 0.8; }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.15); opacity: 1; }
`;

const rotate = keyframes`
  from { transform: rotate(0deg) scale(1); }
  50% { transform: rotate(180deg) scale(1.05); }
  to { transform: rotate(360deg) scale(1); }
`;

const shake = keyframes`
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
`;

const burst = keyframes`
  0% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.8); opacity: 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
`;

interface CloudContainerProps {
  status: string;
}

const CloudContainer = styled(Box)<CloudContainerProps>(({ status, theme }) => {
  const getAnimation = () => {
    switch (status) {
      case 'listening':
        return `${pulse} 1.5s ease-in-out infinite`;
      case 'processing':
        return `${rotate} 8s linear infinite`;
      case 'completed':
        return `${burst} 1.5s ease-out forwards`;
      case 'error':
        return `${shake} 0.5s ease-in-out`;
      default:
        return `${breathe} 4s ease-in-out infinite`;
    }
  };

  const getColor = () => {
    switch (status) {
      case 'listening':
        return 'linear-gradient(135deg, #66BB6A 0%, #81C784 100%)';
      case 'processing':
        return 'linear-gradient(135deg, #7E57C2 0%, #26C6DA 100%)';
      case 'completed':
        return 'linear-gradient(135deg, #4CAF50 0%, #FFD700 100%)';
      case 'error':
        return 'linear-gradient(135deg, #F44336 0%, #E53935 100%)';
      default:
        return 'linear-gradient(135deg, #90CAF9 0%, #64B5F6 100%)';
    }
  };

  return {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    background: getColor(),
    animation: getAnimation(),
    filter: 'blur(8px)',
    opacity: status === 'completed' ? 0.3 : 0.7,
    position: 'relative',
    margin: '0 auto',
    boxShadow: `0 10px 30px rgba(0, 0, 0, 0.2)`,
  };
});

const Particle = styled(Box)<{ index: number; status: string }>(({ index, status }) => {
  const getParticleAnimation = () => {
    switch (status) {
      case 'listening':
        return `${pulse} 1s ease-in-out infinite`;
      case 'processing':
        return `${float} ${2 + index * 0.2}s ease-in-out infinite`;
      case 'completed':
        return `${burst} 1.2s ease-out forwards`;
      default:
        return `${float} ${3 + index * 0.3}s ease-in-out infinite`;
    }
  };

  const angle = (index * 360) / 8;
  const radius = 50;
  const x = Math.cos((angle * Math.PI) / 180) * radius;
  const y = Math.sin((angle * Math.PI) / 180) * radius;

  return {
    width: status === 'processing' ? '8px' : '6px',
    height: status === 'processing' ? '8px' : '6px',
    borderRadius: '50%',
    background: status === 'processing' ? '#26C6DA' : '#fff',
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: `translate(${x}px, ${y}px)`,
    animation: getParticleAnimation(),
    animationDelay: `${index * 0.1}s`,
    boxShadow: '0 0 10px rgba(255, 255, 255, 0.6)',
    opacity: status === 'error' ? 0.3 : 0.8,
  };
});

const IconOverlay = styled(Box)<{ status: string }>(({ status }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  fontSize: '48px',
  opacity: status === 'completed' || status === 'error' ? 1 : 0,
  transition: 'opacity 0.3s ease-in-out',
  filter: 'none',
  zIndex: 10,
}));

const AnimatedAICloud: React.FC<AnimatedAICloudProps> = ({ status }) => {
  const [particles] = useState(Array.from({ length: 8 }, (_, i) => i));

  return (
    <Box
      sx={{
        position: 'relative',
        width: '200px',
        height: '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '20px auto',
      }}
    >
      {/* Particules flottantes */}
      {status !== 'error' && particles.map((index) => (
        <Particle key={index} index={index} status={status} />
      ))}

      {/* Nuage principal */}
      <CloudContainer status={status} />

      {/* Icône de statut */}
      <IconOverlay status={status}>
        {status === 'completed' && '✓'}
        {status === 'error' && '✗'}
      </IconOverlay>

      {/* Texte de statut */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '-30px',
          width: '100%',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: 500,
          color: 'text.secondary',
        }}
      >
        {status === 'idle' && '🧠 Ready to analyze'}
        {status === 'listening' && '👂 Listening...'}
        {status === 'processing' && '🤔 AI thinking...'}
        {status === 'completed' && '✨ Analysis complete!'}
        {status === 'error' && '⚠️ Error occurred'}
      </Box>
    </Box>
  );
};

export default AnimatedAICloud;
