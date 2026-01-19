"use client";

import React, { useEffect, useRef } from "react";

interface TopographicPatternProps {
    className?: string;
    lineCount?: number;
    baseColor?: string;
}

const TopographicPattern: React.FC<TopographicPatternProps> = ({
    className = "",
    lineCount = 12,
    baseColor = "orange",
}) => {
    const svgRef = useRef<SVGSVGElement>(null);

    useEffect(() => {
        const svg = svgRef.current;
        if (!svg) return;

        const paths = svg.querySelectorAll("path");
        const animations: number[] = [];

        paths.forEach((path, index) => {
            const length = path.getTotalLength();
            path.style.strokeDasharray = `${length}`;
            path.style.strokeDashoffset = "0";

            // Animate each line with different phase
            let phase = index * 0.5;
            const speed = 0.008 + Math.random() * 0.004;
            const amplitude = 2 + Math.random() * 3;

            const animate = () => {
                phase += speed;
                const offset = Math.sin(phase) * amplitude;
                path.style.transform = `translateY(${offset}px)`;
                animations[index] = requestAnimationFrame(animate);
            };

            animations[index] = requestAnimationFrame(animate);
        });

        return () => {
            animations.forEach((id) => cancelAnimationFrame(id));
        };
    }, []);

    // Generate wavy path data
    const generateWavyPath = (
        yBase: number,
        amplitude: number,
        frequency: number,
        phase: number,
        width: number
    ): string => {
        const points: string[] = [];
        const segments = 100;

        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * width;
            const y =
                yBase +
                Math.sin((x / width) * Math.PI * frequency + phase) * amplitude +
                Math.sin((x / width) * Math.PI * frequency * 2.3 + phase * 1.5) * (amplitude * 0.4) +
                Math.sin((x / width) * Math.PI * frequency * 0.7 + phase * 0.8) * (amplitude * 0.6);

            if (i === 0) {
                points.push(`M ${x} ${y}`);
            } else {
                points.push(`L ${x} ${y}`);
            }
        }

        return points.join(" ");
    };

    const width = 1200;
    const height = 800;
    const lines = [];

    for (let i = 0; i < lineCount; i++) {
        const yBase = (height / (lineCount + 1)) * (i + 1);
        const amplitude = 15 + Math.sin(i * 0.5) * 10;
        const frequency = 2 + (i % 3) * 0.5;
        const phase = i * 0.8;
        const opacity = 0.08 + (Math.sin(i * 0.7) + 1) * 0.12;

        lines.push({
            path: generateWavyPath(yBase, amplitude, frequency, phase, width),
            opacity,
            strokeWidth: 1 + (i % 3) * 0.5,
        });
    }

    const colorMap: Record<string, string> = {
        orange: "rgb(249, 115, 22)",
        white: "rgb(255, 255, 255)",
        blue: "rgb(59, 130, 246)",
    };

    const strokeColor = colorMap[baseColor] || colorMap.orange;

    return (
        <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
            <svg
                ref={svgRef}
                viewBox={`0 0 ${width} ${height}`}
                preserveAspectRatio="xMidYMid slice"
                className="w-full h-full"
                style={{ minWidth: "100%", minHeight: "100%" }}
            >
                {lines.map((line, index) => (
                    <path
                        key={index}
                        d={line.path}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth={line.strokeWidth}
                        strokeOpacity={line.opacity}
                        strokeLinecap="round"
                        style={{
                            transition: "transform 0.1s ease-out",
                        }}
                    />
                ))}
            </svg>
        </div>
    );
};

export default TopographicPattern;