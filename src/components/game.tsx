'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';

class Pendulum {
    length: number;
    angle: number;
    angularVelocity: number;
    angularAcceleration: number;
    verticalVelocity: number;
    originX: number;
    originY: number;
    bobX: number;
    bobY: number;
    mass: number;
    cut: boolean;

    constructor(length: number, angle: number, originX: number, originY: number, mass: number = 1) {
        this.length = length;
        this.angle = angle;
        this.angularVelocity = 0;
        this.angularAcceleration = 0;
        this.verticalVelocity = 0;
        this.originX = originX;
        this.originY = originY;
        this.bobX = 0;
        this.bobY = 0;
        this.mass = mass;
        this.cut = false;
        this.updateBobPosition();
    }

    updateBobPosition() {
        this.bobX = this.originX + this.length * Math.sin(this.angle);
        this.bobY = this.originY + this.length * Math.cos(this.angle);
    }

    updatePhysics(gravity: number) {
        if (!this.cut) {
            this.angularAcceleration = (-gravity / this.length) * Math.sin(this.angle);
            this.angularVelocity += this.angularAcceleration;
            this.angle += this.angularVelocity;
            this.angularVelocity *= 0.99; // damping
            this.updateBobPosition();
        } else {
            // Simulate falling if cut
            this.verticalVelocity += gravity; // Increase the speed of falling
            this.originY += this.verticalVelocity;
            this.originX += this.length * Math.sin(this.angularVelocity);
            this.updateBobPosition();
        }
    }

    draw(context: CanvasRenderingContext2D) {
        if (!this.cut) {
            context.strokeStyle = "white";
            context.beginPath();
            context.moveTo(this.originX, this.originY);
            context.lineTo(this.bobX, this.bobY);
            context.stroke();
        }

        context.fillStyle = "white";
        context.beginPath();
        context.arc(this.bobX, this.bobY, 10, 0, 2 * Math.PI);
        context.fill();
    }
}

const Game: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gravity, setGravity] = useState(9.81);
    const gravityRef = useRef(gravity);
    const pendulumsRef = useRef<Pendulum[]>([]);
    const originY = 50;
    const angles = [Math.PI / 4, Math.PI / 6, Math.PI / 8, Math.PI / 10];
    const animationFrameId = useRef<number | null>(null);
    const movingUpRef = useRef<boolean>(false);
    const [hasWon, setHasWon] = useState<boolean>(false);

    const initializePendulums = useCallback(() => {
        const canvas = canvasRef.current!;
        const originX = canvas.width / 2;
        const totalHeight = 800; // The total height for the pendulums
        const lengths = Array(4).fill(totalHeight / 4); // Spread the bodies across 800 pixels

        pendulumsRef.current = [];
        for (let i = 0; i < 4; i++) {
            pendulumsRef.current.push(new Pendulum(lengths[i], angles[i], originX, originY));
        }
        console.log("Pendulums initialized");
    }, [angles, originY]);

    const resizeCanvas = useCallback(() => {
        if (canvasRef.current) {
            const canvas = canvasRef.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const originX = canvas.width / 2;

            pendulumsRef.current.forEach((pendulum, index) => {
                pendulum.originX = index === 0 ? originX : pendulumsRef.current[index - 1].bobX;
                pendulum.originY = index === 0 ? originY : pendulumsRef.current[index - 1].bobY;
            });
            console.log("Canvas resized and pendulums updated");
        }
    }, [originY]);

    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (event.code === 'Space') {
            console.log("Spacebar pressed");
            event.preventDefault();
            setHasWon((prevHasWon) => {
                if (prevHasWon) {
                    console.log("Restarting game");
                    initializePendulums();
                    return false;
                } else {
                    for (let i = 1; i < pendulumsRef.current.length; i++) {
                        pendulumsRef.current[i].cut = true;
                    }
                    console.log("Pendulums cut");
                    return prevHasWon;
                }
            });
        }
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            movingUpRef.current = true;
            console.log("ArrowUp pressed");
        }
    }, [initializePendulums]);

    const handleKeyUp = useCallback((event: KeyboardEvent) => {
        if (event.code === 'ArrowUp') {
            event.preventDefault();
            movingUpRef.current = false;
            console.log("ArrowUp released");
        }
    }, []);

    useEffect(() => {
        console.log("Effect: Initial setup");
        if (pendulumsRef.current.length === 0) {
            initializePendulums();
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [initializePendulums, resizeCanvas, handleKeyDown, handleKeyUp]);

    useEffect(() => {
        gravityRef.current = gravity;
        console.log("Gravity updated:", gravity);
    }, [gravity]);

    useEffect(() => {
        console.log("Effect: Animation loop started");
        const animate = () => {
            if (canvasRef.current && !hasWon) {
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d') as CanvasRenderingContext2D;

                context.clearRect(0, 0, canvas.width, canvas.height);

                if (movingUpRef.current) {
                    const totalMassBelow = pendulumsRef.current.reduce((sum, pendulum) => sum + (pendulum.cut ? 0 : pendulum.mass), 0);
                    const appliedPower = 100; // Example constant power output (in watts)
                    const climbingSpeed = appliedPower / (totalMassBelow * gravityRef.current); // Velocity = Power / (Force = m * g)

                    const deltaX = climbingSpeed * Math.sin(pendulumsRef.current[0].angle);
                    const deltaY = climbingSpeed * Math.cos(pendulumsRef.current[0].angle);
                    pendulumsRef.current[0].bobY -= deltaY;
                    pendulumsRef.current[0].bobX -= deltaX;
                    pendulumsRef.current[0].length -= climbingSpeed;

                    // Check if the climber has reached the origin
                    if (pendulumsRef.current[0].bobY <= originY) {
                        console.log("Win event");
                        setHasWon(true);
                        return;
                    }
                }

                for (let i = 0; i < pendulumsRef.current.length; i++) {
                    if (i > 0 && !pendulumsRef.current[i].cut) {
                        pendulumsRef.current[i].originX = pendulumsRef.current[i - 1].bobX;
                        pendulumsRef.current[i].originY = pendulumsRef.current[i - 1].bobY;
                    }
                    pendulumsRef.current[i].updatePhysics(gravityRef.current);
                    pendulumsRef.current[i].draw(context);
                }

                animationFrameId.current = requestAnimationFrame(animate);
            }
        };

        if (!hasWon) {
            animationFrameId.current = requestAnimationFrame(animate);
        } else {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        }

        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [hasWon]);

    const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGravity(parseFloat(event.target.value));
    };

    console.log("Player has won? ", hasWon);

    return (
        <div>
            {hasWon ? (
                <div style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>
                    <h1>You Win!</h1>
                    <p>The climber has reached the origin.</p>
                    <p>Press Space to play again!</p>
                </div>
            ) : (
                <>
                    <span style={{ color: "white" }}>Gravity:</span>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.1"
                        value={gravity}
                        onChange={handleSliderChange}
                        style={{ width: '20%' }}
                    />
                </>
            )}
            <canvas ref={canvasRef} style={{ background: '#000000' }} />
        </div>
    );
};

export default Game;
