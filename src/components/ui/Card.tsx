import { HTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion, HTMLMotionProps } from "motion/react";

export interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, hoverable = false, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        whileHover={hoverable ? { y: -5, transition: { duration: 0.2 } } : undefined}
        className={cn(
          "bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden",
          hoverable && "hover:shadow-2xl transition-shadow duration-300",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";

export { Card };
