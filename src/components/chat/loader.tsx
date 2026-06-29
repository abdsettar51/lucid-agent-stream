import { motion } from "framer-motion";

import { AriaMark } from "@/components/chat/brand";

export function LoaderScreen() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <motion.img
          src={AriaMark}
          alt="Aria"
          width={56}
          height={56}
          className="size-14 object-contain"
          animate={{ scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <span className="font-display text-sm text-muted-foreground">Loading Aria…</span>
      </motion.div>
    </div>
  );
}
