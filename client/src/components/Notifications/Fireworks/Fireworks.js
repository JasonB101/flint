import React from 'react';
import Styles from './Fireworks.module.scss';

function Fireworks() {
  // Create spectacular firework explosions
  const fireworkElements = Array.from({ length: 8 }, (_, index) => (
    <div 
      key={index} 
      className={`${Styles.firework} ${Styles[`firework${index + 1}`]}`}
    >
      {/* Main explosion with more particles */}
      <div className={Styles.explosion}>
        {Array.from({ length: 20 }, (_, particleIndex) => (
          <div 
            key={particleIndex} 
            className={`${Styles.particle} ${Styles[`particle${particleIndex + 1}`]}`}
          ></div>
        ))}
      </div>
      
      {/* Secondary smaller explosions for more drama */}
      <div className={Styles.secondaryExplosion}>
        {Array.from({ length: 12 }, (_, sparkIndex) => (
          <div 
            key={sparkIndex} 
            className={`${Styles.spark} ${Styles[`spark${sparkIndex + 1}`]}`}
          ></div>
        ))}
      </div>
      
      {/* Trail effect */}
      <div className={Styles.trail}></div>
    </div>
  ));

  return (
    <div className={Styles.fireworksContainer}>
      {/* Add some background sparkles */}
      <div className={Styles.backgroundSparkles}>
        {Array.from({ length: 15 }, (_, index) => (
          <div 
            key={index}
            className={`${Styles.backgroundSparkle} ${Styles[`sparkle${index + 1}`]}`}
          ></div>
        ))}
      </div>
      
      {fireworkElements}
      
      {/* Add some floating embers */}
      <div className={Styles.embers}>
        {Array.from({ length: 10 }, (_, index) => (
          <div 
            key={index}
            className={`${Styles.ember} ${Styles[`ember${index + 1}`]}`}
          ></div>
        ))}
      </div>
    </div>
  );
}

export default Fireworks;
