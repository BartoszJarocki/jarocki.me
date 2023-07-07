import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import { MouseEvent } from 'react';

interface Props {
  children: React.ReactNode;
}

export const Glow = ({ children }: Props) => {
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function handleMouseMove({ clientX, clientY, currentTarget }: MouseEvent) {
    let { left, top } = currentTarget.getBoundingClientRect();

    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  const background = useMotionTemplate`radial-gradient(100px circle at ${mouseX}px ${mouseY}px, rgb(14 165 233 / 0.15), transparent 80%)`;

  return (
    <div onMouseMove={handleMouseMove} className="relative group overflow-visible">
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background,
        }}
      />

      {children}
    </div>
  );
};
