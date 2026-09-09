import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
export const Button=forwardRef<HTMLButtonElement,ButtonHTMLAttributes<HTMLButtonElement> & {variant?:"solid"|"outline"|"ghost"}>(({className,variant="solid",...props},ref)=><button ref={ref} className={cn("button",`button-${variant}`,className)} {...props}/>); Button.displayName="Button";
export const Input=forwardRef<HTMLInputElement,InputHTMLAttributes<HTMLInputElement>>(({className,...props},ref)=><input ref={ref} className={cn("input",className)} {...props}/>); Input.displayName="Input";
