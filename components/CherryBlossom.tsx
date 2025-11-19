import React, { useEffect, useState } from 'react';

interface Petal {
  id: number;
  left: number;
  animationDuration: number;
  delay: number;
  scale: number;
  rotation: number;
}

function CherryBlossom() {
  const [petals, setPetals] = useState<Petal[]>([]);

  useEffect(() => {
    const numberOfPetals = 30;
    const newPetals = Array.from({ length: numberOfPetals }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      animationDuration: 6 + Math.random() * 4,
      delay: Math.random() * 5,
      scale: 0.3 + Math.random() * 0.5,
      rotation: Math.random() * 360,
    }));
    setPetals(newPetals);
  }, []);

  return (
    <div className="cherry-blossom-container">
      {petals.map((petal) => (
        <div
          key={petal.id}
          className="petal"
          style={{
            left: `${petal.left}%`,
            animationDuration: `${petal.animationDuration}s`,
            animationDelay: `${petal.delay}s`,
            transform: `scale(${petal.scale}) rotate(${petal.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

export default CherryBlossom;