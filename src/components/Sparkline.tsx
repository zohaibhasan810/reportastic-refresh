import { useEffect, useRef } from "react";
    
    interface SparklineProps {
      data: number[];
      width?: number;
      height?: number;
      color?: string;
    }
    
    export const Sparkline = ({ data, width = 100, height = 30, color = "#0EA5E9" }: SparklineProps) => {
      const canvasRef = useRef<HTMLCanvasElement>(null);
    
      useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;
    
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
    
        const drawSparkline = () => {
          ctx.clearRect(0, 0, width, height);
          
          const max = Math.max(...data);
          const min = Math.min(...data);
          const range = max - min;
          
          const xStep = width / (data.length - 1);
          const scale = range ? height / range : 1;
    
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
    
          data.forEach((value, index) => {
            const x = index * xStep;
            const y = range ? height - ((value - min) * scale) : height / 2;
            
            if (index === 0) {
              ctx.moveTo(x, y);
            } else {
              ctx.lineTo(x, y);
            }
          });
    
          ctx.stroke();
        };
    
        drawSparkline();
      }, [data, width, height, color]);
    
      return (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="inline-block"
        />
      );
    };
