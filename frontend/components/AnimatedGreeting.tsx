import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

interface AnimatedGreetingProps {
  name: string;
}

export function AnimatedGreeting({ name }: AnimatedGreetingProps) {
  const [isVisible, setIsVisible] = useState(false);

  const getGreeting = () => {
    if (!name) return "Welcome to Yo";
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const greetingText = name ? `${getGreeting()}, ${name}` : getGreeting();
  const assistText = "How can I assist you today?";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="flex flex-col items-center">
      <h3
        className="scroll-m-20 text-3xl md:text-5xl font-medium text-center tracking-wide overflow-hidden"
        aria-label={greetingText}
      >
        <AnimatePresence>
          {isVisible && (
            <motion.span
              style={{
                display: "inline-block",
                padding: "0.1em 0 0.2em",
              }}
              initial={{
                clipPath: "inset(120% 0 -20% 0)",
                y: "60px",
                rotateX: "12deg",
                opacity: 0,
              }}
              animate={{
                clipPath: "inset(0 0 0 0)",
                y: "0px",
                rotateX: "0deg",
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                delay: 0.3,
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
            >
              {greetingText}
            </motion.span>
          )}
        </AnimatePresence>
      </h3>
      <div className="text-lg md:text-xl font-normal text-center tracking-wide overflow-hidden">
        <AnimatePresence>
          {isVisible && (
            <motion.span
              style={{
                display: "inline-block",
                padding: "0.1em 0 0.2em",
              }}
              initial={{
                clipPath: "inset(120% 0 -20% 0)",
                y: "60px",
                rotateX: "12deg",
                opacity: 0,
              }}
              animate={{
                clipPath: "inset(0 0 0 0)",
                y: "0px",
                rotateX: "0deg",
                opacity: 1,
              }}
              transition={{
                duration: 1.2,
                delay: 0.5, // Slightly delayed compared to the greeting
                ease: [0.2, 0.65, 0.3, 0.9],
              }}
            >
              {assistText}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
