interface StepIndicatorProps {
    current: number;
    steps: string[];
    setStep: (step: number) => void
}

export default function StepIndicator({ setStep, current, steps }: StepIndicatorProps) {
    return (
        <div className="flex justify-start items-center mb-8 gap-4">
            {steps.map((label, index) => (
                <div
                    key={index}
                    onClick={() => setStep(index + 1)}
                    className={`flex items-center cursor-pointer gap-2 transition-all duration-300 ${
                        index + 1 === current
                            ? 'opacity-100'
                            : 'opacity-50'
                    }`}
                >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold ${
                        index + 1 === current
                            ? 'bg-accent text-white'
                            : 'bg-gray-300 text-gray-800'
                    }`}>
                        {index + 1}
                    </div>
                    <span className={`text-sm ${index + 1 === current ? 'font-semibold' : 'font-medium'}`}>
                        {label}
                    </span>
                </div>
            ))}
        </div>
    );
}
