"use client";

import { CheckmarkIcon } from "@/assets/icons/ui";

export interface Step {
    label: string;
    /** Whether this step is completed (shows checkmark) */
    completed?: boolean;
}

export interface StepIndicatorProps {
    /** Array of steps with labels */
    steps: Step[];
    /** Current active step index (0-indexed) */
    currentStep: number;
    /** Optional callback when a step is clicked (enables navigation) */
    onStepClick?: (stepIndex: number) => void;
    /** Visual variant: 'simple' (horizontal text) or 'compact' (circles with connectors) */
    variant?: "simple" | "compact";
    /** Additional className for the container */
    className?: string;
}

/**
 * Reusable step indicator component.
 *
 * Usage:
 * ```tsx
 * // Simple variant (default) - for multi-step forms
 * <StepIndicator
 *   steps={[{ label: "Details" }, { label: "Location" }, { label: "Review" }]}
 *   currentStep={1}
 *   onStepClick={(step) => setCurrentStep(step)}
 * />
 *
 * // Compact variant - for modals/wizards with completion state
 * <StepIndicator
 *   variant="compact"
 *   steps={[
 *     { label: "Login", completed: !!user },
 *     { label: "Verify", completed: isVerified },
 *     { label: "Done", completed: isSuccess }
 *   ]}
 *   currentStep={1}
 * />
 * ```
 */
export default function StepIndicator({
    steps,
    currentStep,
    onStepClick,
    variant = "simple",
    className = "",
}: StepIndicatorProps) {
    if (variant === "compact") {
        return (
            <div className={`flex items-center gap-2 ${className}`}>
                {steps.map((step, index) => (
                    <div key={index} className="contents">
                        <StepCircle
                            number={index + 1}
                            label={step.label}
                            active={currentStep === index}
                            completed={step.completed}
                            onClick={onStepClick ? () => onStepClick(index) : undefined}
                        />
                        {index < steps.length - 1 && (
                            <div className="flex-1 h-px bg-border-light" />
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // Simple variant
    return (
        <div className={`flex justify-start items-center gap-4 ${className}`}>
            {steps.map((step, index) => {
                const isActive = currentStep === index;
                const isCompleted = step.completed;
                const isClickable = !!onStepClick;

                return (
                    <div
                        key={index}
                        onClick={isClickable ? () => onStepClick(index) : undefined}
                        className={`flex items-center gap-2 transition-all duration-300 ${
                            isClickable ? "cursor-pointer" : ""
                        } ${isActive ? "opacity-100" : "opacity-50"}`}
                    >
                        <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                                isCompleted
                                    ? "bg-green-500 text-white"
                                    : isActive
                                    ? "bg-accent text-white"
                                    : "bg-gray-300 text-gray-800"
                            }`}
                        >
                            {isCompleted ? (
                                <CheckmarkIcon className="w-4 h-4" />
                            ) : (
                                index + 1
                            )}
                        </div>
                        <span className={`text-sm ${isActive ? "font-semibold" : "font-medium"}`}>
                            {step.label}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}

/** Individual step circle for compact variant */
function StepCircle({
    number,
    label,
    active,
    completed,
    onClick,
}: {
    number: number;
    label: string;
    active: boolean;
    completed?: boolean;
    onClick?: () => void;
}) {
    return (
        <div
            className={`flex flex-col items-center gap-1 ${onClick ? "cursor-pointer" : ""}`}
            onClick={onClick}
        >
            <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    completed
                        ? "bg-green-500 text-white"
                        : active
                        ? "bg-accent text-white"
                        : "bg-surface-light text-text-light"
                }`}
            >
                {completed ? (
                    <CheckmarkIcon className="w-4 h-4" />
                ) : (
                    number
                )}
            </div>
            <span className={`text-xs ${active || completed ? "text-white" : "text-text-light"}`}>
                {label}
            </span>
        </div>
    );
}
