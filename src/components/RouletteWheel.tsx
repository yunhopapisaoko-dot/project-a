import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';

interface Prize {
  id: string;
  type: 'money' | 'voucher' | 'disease';
  label: string;
  value?: number;
  color: string;
}

interface RouletteWheelProps {
  prizes: Prize[];
  spinning: boolean;
  winningIndex: number;
  onSpinComplete: () => void;
}

export function RouletteWheel({ prizes, spinning, winningIndex, onSpinComplete }: RouletteWheelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rotationRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    // Draw wheel
    const drawWheel = (rotation: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const totalPrizes = prizes.length;
      const arcSize = (2 * Math.PI) / totalPrizes;

      // Draw segments
      prizes.forEach((prize, index) => {
        const startAngle = rotation + index * arcSize;
        const endAngle = startAngle + arcSize;

        // Draw segment
        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw text
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(prize.label, radius - 15, 5);
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Draw center icon
      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎰', centerX, centerY);
    };

    drawWheel(rotationRef.current);
  }, [prizes]);

  useEffect(() => {
    if (!spinning) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 10;

    const totalPrizes = prizes.length;
    const arcSize = (2 * Math.PI) / totalPrizes;

    // Calculate target rotation
    const targetAngle = (2 * Math.PI) - (winningIndex * arcSize) - (arcSize / 2);
    const fullRotations = 5 * (2 * Math.PI); // 5 full rotations
    const targetRotation = fullRotations + targetAngle;

    const startTime = Date.now();
    const duration = 5500; // 5.5 seconds

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      rotationRef.current = eased * targetRotation;

      // Draw wheel
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      prizes.forEach((prize, index) => {
        const startAngle = rotationRef.current + index * arcSize;
        const endAngle = startAngle + arcSize;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = prize.color;
        ctx.fill();
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + arcSize / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.shadowColor = 'rgba(0,0,0,0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(prize.label, radius - 15, 5);
        ctx.restore();
      });

      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#0a0a0f';
      ctx.fill();
      ctx.strokeStyle = '#22d3ee';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#22d3ee';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🎰', centerX, centerY);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        onSpinComplete();
      }
    };

    animate();
  }, [spinning, winningIndex, prizes, onSpinComplete]);

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={400}
        className="max-w-full"
      />
      {/* Pointer at top */}
      <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
        <div className="w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-cyan-400"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(34,211,238,0.8))'
          }}
        />
      </div>
    </div>
  );
}
