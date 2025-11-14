import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg border border-transparent text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950",
  {
    variants: {
      variant: {
        default: "bg-gold-500 text-slate-950 hover:bg-gold-400 focus-visible:ring-gold-400",
        outline:
          "border-slate-700 bg-transparent text-slate-100 hover:border-gold-500 hover:text-gold-200 focus-visible:ring-gold-500",
        ghost: "text-slate-300 hover:text-gold-200 hover:bg-slate-800/60",
        destructive: "bg-red-500 text-white hover:bg-red-400 focus-visible:ring-red-400"
      },
      size: {
        default: "h-10 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-6 text-base",
        icon: "h-10 w-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const Button = ({ className, variant, size, asChild = false, ...props }: ButtonProps) => {
  const Component = asChild ? Slot : "button";
  return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />;
};

export { Button, buttonVariants };
