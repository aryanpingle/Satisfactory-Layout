import { twMerge } from "tailwind-merge";

type Props = {
    className: ClassNameValue;
};

export function LeftPanel(props: Props) {
    return (
        <div className={twMerge(props.className, "border-r border-gray-800")}>
            Left panel here
        </div>
    );
}
