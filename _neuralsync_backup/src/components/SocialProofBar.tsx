import { useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle, X } from "lucide-react";

interface Notification {
  name: string;
  city: string;
  action: string;
  timeAgo: string;
  gradientFrom: string;
  gradientTo: string;
}

const notifications: Notification[] = [
  {
    name: "Dr. Sarah K.",
    city: "London",
    action: "activated the protocol",
    timeAgo: "2 hours ago",
    gradientFrom: "#00f3ff",
    gradientTo: "#bd00ff",
  },
  {
    name: "Marcus V.",
    city: "Berlin",
    action: "purchased",
    timeAgo: "45 minutes ago",
    gradientFrom: "#bd00ff",
    gradientTo: "#8553ff",
  },
  {
    name: "Dr. Aiko T.",
    city: "Tokyo",
    action: "started the program",
    timeAgo: "12 minutes ago",
    gradientFrom: "#8553ff",
    gradientTo: "#00f3ff",
  },
  {
    name: "Elena R.",
    city: "Barcelona",
    action: "joined the waitlist",
    timeAgo: "3 hours ago",
    gradientFrom: "#00f3ff",
    gradientTo: "#8553ff",
  },
  {
    name: "James L.",
    city: "Toronto",
    action: "upgraded to Pro",
    timeAgo: "28 minutes ago",
    gradientFrom: "#bd00ff",
    gradientTo: "#00f3ff",
  },
  {
    name: "Prof. Nina S.",
    city: "Stockholm",
    action: "activated the protocol",
    timeAgo: "1 hour ago",
    gradientFrom: "#8553ff",
    gradientTo: "#bd00ff",
  },
  {
    name: "David M.",
    city: "Sydney",
    action: "purchased",
    timeAgo: "5 minutes ago",
    gradientFrom: "#00f3ff",
    gradientTo: "#bd00ff",
  },
  {
    name: "Dr. Priya N.",
    city: "Mumbai",
    action: "started the program",
    timeAgo: "38 minutes ago",
    gradientFrom: "#bd00ff",
    gradientTo: "#8553ff",
  },
];

export default function SocialProofBar() {
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const [index, setIndex] = useState(0);

  const showNext = useCallback(() => {
    setVisible(true);

    const hideTimer = setTimeout(() => {
      setVisible(false);
    }, 4000);

    return hideTimer;
  }, []);

  useEffect(() => {
    if (dismissed) return;

    // Initial delay before first notification
    const initialDelay = setTimeout(() => {
      showNext();
    }, 5000);

    return () => clearTimeout(initialDelay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;

    // After each hide, schedule the next notification
    if (!visible && index >= 0) {
      const nextTimer = setTimeout(() => {
        setIndex((prev) => (prev + 1) % notifications.length);
        setVisible(true);

        // Auto-hide after 4s
        const hideTimer = setTimeout(() => {
          setVisible(false);
        }, 4000);

        return () => clearTimeout(hideTimer);
      }, 12000);

      return () => clearTimeout(nextTimer);
    }
  }, [visible, dismissed, index]);

  if (dismissed) return null;

  const notif = notifications[index];

  return (
    <div className="fixed bottom-6 left-4 z-40" style={{ maxWidth: 320 }}>
      <AnimatePresence>
        {visible && (
          <motion.div
            key={index}
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ type: "tween", duration: 0.4, ease: "easeOut" }}
            className="bg-black/70 border border-white/10 rounded-xl px-4 py-3 flex items-center gap-3 shadow-2xl"
          >
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-full flex-shrink-0"
              style={{
                background: `linear-gradient(135deg, ${notif.gradientFrom}, ${notif.gradientTo})`,
              }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-white/90 text-xs leading-snug">
                <span className="font-semibold text-white">{notif.name}</span>{" "}
                <span className="text-white/60">from</span>{" "}
                <span className="text-white/80">{notif.city}</span>{" "}
                {notif.action}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-white/40">{notif.timeAgo}</span>
                <span className="text-[10px] text-white/20">·</span>
                <span className="inline-flex items-center gap-0.5 text-[10px] text-[#00f3ff]/80">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              className="flex-shrink-0 p-1 rounded-md text-white/30 hover:text-white/60 transition-colors"
              aria-label="Dismiss notifications"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
