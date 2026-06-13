import { twMerge } from "tailwind-merge";

type Props = {
    className: ClassNameValue;
};

export function RightPanel({ className }: Props) {
    return (
        <div className={twMerge(className, "border-l border-gray-800 p-2")}>
            Right Panel
        </div>
    );
}
