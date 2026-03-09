import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const groups = [
  {
    heading: "AI-powered home maintenance assistance",
    benefits: [
      "Free to join — no credit card, no catch",
      "Built-in accounting to track every dollar",
      "One CRM to manage projects, quotes & pros",
    ],
    bg: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  },
  {
    heading: "Smarter Home Ownership Starts Here",
    benefits: [
      "Never miss a maintenance reminder again",
      "Keep all your home records in one digital hub",
      "AI cost estimates before you hire anyone",
    ],
    bg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  },
  {
    heading: "Grow Your Pro Business Effortlessly",
    benefits: [
      "Stay in touch with clients — automated follow-ups",
      "Track jobs, invoices & earnings in one place",
      "AI quote bot works 24/7 so you never miss a lead",
    ],
    bg: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80",
  },
];

export default function BenefitCarousel({ onBatchChange }) {
  const [scrollY, setScrollY] = useState(0);
  const [currentBatch, setCurrentBatch] = useState(0);

  const changeBatch = (next) => {
    setCurrentBatch(next);
    if (onBatchChange) onBatchChange(next, groups[next].bg);
  };

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBatch(prev => {
        const next = (prev + 1) % groups.length;
        if (onBatchChange) onBatchChange(next, groups[next].bg);
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [onBatchChange]);

  const opacity = Math.max(0, 1 - scrollY / 600);

  return (
    <div
      className="w-full flex flex-col items-center justify-center overflow-hidden mt-4 mb-8"
      style={{
        position: 'relative',
        zIndex: 10,
        transform: `translateY(${scrollY * 1.2}px)`,
        opacity,
      }}
    >
      <div className="relative w-full max-w-4xl" style={{ minHeight: '170px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentBatch}
            className="flex flex-col gap-2 pointer-events-none items-center px-10"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '-100%', opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
          >
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold text-white text-center leading-tight mb-2 drop-shadow-2xl"
              style={{ textShadow: '2px 2px 10px rgba(0,0,0,0.85)' }}
            >
              {groups[currentBatch].heading}
            </h1>
            {groups[currentBatch].benefits.map((benefit, idx) => (
              <span
                key={idx}
                className="text-white text-base md:text-xl font-semibold text-center leading-snug drop-shadow-lg block"
                style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.7)' }}
              >
                {benefit}
              </span>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        <button
          onClick={() => changeBatch((currentBatch - 1 + groups.length) % groups.length)}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300 pointer-events-auto"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6 text-white" />
        </button>
        <button
          onClick={() => changeBatch((currentBatch + 1) % groups.length)}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 border-2 border-white shadow-lg flex items-center justify-center transition-all duration-300 pointer-events-auto"
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
}