type Variant = "orange" | "green";

type Props = {
    text: string;
    variant?: Variant;
};

const variantClasses: Record<Variant, string> = {
    orange: "bg-[#ffe5c2] text-[#d46800]",
    green: "bg-success-subtle text-success",
};

export default function Badge({ text, variant = "orange" }: Props) {
    return (
        <div className={`${variantClasses[variant]} text-sm py-1 px-3 rounded-2xl font-semibold inline-block mb-2`}>
            {text}
        </div>
    );
}
