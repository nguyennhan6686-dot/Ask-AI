import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../../utils/cn";
import { motion, HTMLMotionProps } from "motion/react";

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary:
        "bg-gradient-to-r from-blue-500 via-purple-500 to-orange-500 text-white shadow-lg hover:shadow-xl hover:opacity-90",
      secondary: "bg-white text-gray-800 shadow-md hover:bg-gray-50 border border-gray-200",
      outline: "border-2 border-purple-500 text-purple-600 hover:bg-purple-50",
      ghost: "hover:bg-gray-100 text-gray-700",
      danger: "bg-red-500 text-white shadow-md hover:bg-red-600",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm rounded-lg",
      md: "px-5 py-2.5 text-base rounded-xl",
      lg: "px-8 py-4 text-lg rounded-2xl font-bold",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(
          "inline-flex items-center justify-center font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
