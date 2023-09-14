import React, { useEffect, useState } from 'react';
import Styles from './Fireworks.module.scss';

function Fireworks() {
  const [fireworks, setFireworks] = useState([]);

  useEffect(() => {
    const canvas = document.getElementById('fireworks-canvas');
    const ctx = canvas.getContext('2d');
    const canvasWidth = 400; // Set canvas width
    const canvasHeight = 200; // Set canvas height
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;

    const allowedColors = ['#26303f', '#fffcfc', '#fac515'];
                            //BLue     WHite     Gold

    function createParticle(x, y) {
        const initialAngle = Math.random() * Math.PI * 2; // Random angle in radians (full circle)
        const initialSpeed = Math.random() * 3 + 2; // Adjust the speed for the initial explosion
        const color = allowedColors[Math.floor(Math.random() * allowedColors.length)]; // Random color selection
      
        return {
          x,
          y,
          color,
          radius: Math.random() * 3 + 1,
          velocity: {
            x: Math.cos(initialAngle) * initialSpeed, // Horizontal velocity for circular motion
            y: Math.sin(initialAngle) * initialSpeed, // Vertical velocity for circular motion
          },
          gravity: 0.02, // Adjust the gravity for slower descent
          opacity: 1,
        };
      }
      
      

      function createFirework() {
        const color = allowedColors[Math.floor(Math.random() * allowedColors.length)];
        const offset = Math.random() * 200 - 100; // Random offset between -100 and 100 pixels
        const fireworksX = centerX + offset;
        const fireworksY = centerY;
        const particles = [];
      
        const numParticles = 100; // Adjust the number of particles for the explosion
      
        for (let i = 0; i < numParticles; i++) {
          particles.push(createParticle(fireworksX, fireworksY, color));
        }
      
        setFireworks((prevFireworks) => [...prevFireworks, { particles }]);
      }
      
      

      function animateFireworks() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false; // Disable anti-aliasing for sharper rendering
      
        setFireworks((prevFireworks) => {
          const newFireworks = [];
      
          prevFireworks.forEach((firework) => {
            const particles = firework.particles.map((particle) => {
              // Update particle positions based on velocity and gravity
              particle.x += particle.velocity.x;
              particle.y += particle.velocity.y;
              particle.velocity.y += particle.gravity;
              particle.opacity -= 0.001;
      
              // Draw the particle on the canvas
              ctx.beginPath();
              ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
              ctx.fillStyle = particle.color;
              ctx.globalAlpha = particle.opacity;
              ctx.fill();
      
              return particle.opacity > 0 ? particle : null;
            }).filter((particle) => particle !== null);
      
            if (particles.length > 0) {
              newFireworks.push({ particles });
            }
          });
      
          return newFireworks;
        });
      
        requestAnimationFrame(animateFireworks);
      }
      

    function startFireworks() {
        const minDelay = 200; // Minimum delay in milliseconds between fireworks
        const maxDelay = 1000; // Maximum delay in milliseconds between fireworks
      
        function createAndScheduleFirework() {
          const delay = Math.random() * (maxDelay - minDelay) + minDelay;
          const intervalId = setInterval(() => {
            createFirework();
            clearInterval(intervalId); // Clear the interval after creating one firework
            createAndScheduleFirework(); // Schedule the next firework
          }, delay);
        }
      
        createAndScheduleFirework(); // Start the fireworks display
        animateFireworks();
      }

    const initialDelay = 3000; // Initial delay before starting fireworks

    const delayTimeout = setTimeout(() => {
      startFireworks();
    }, initialDelay);

    return () => {
      // Cleanup code if needed
      clearTimeout(delayTimeout); // Clear the initial delay timeout if the component unmounts
    };
  }, []);

  return (
    <canvas className={Styles.fireworksCanvas} id="fireworks-canvas"></canvas>
  );
}

export default Fireworks;
