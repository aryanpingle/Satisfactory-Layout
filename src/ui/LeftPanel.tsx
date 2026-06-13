import { twMerge } from "tailwind-merge";
import { store } from "../stateManager";

type Props = {
    className: ClassNameValue;
};

export function LeftPanel(props: Props) {
    const stateName = store((a) => a.currentState.name);
    return (
        <div className={twMerge(props.className, "border-r border-gray-800 text-white")}>
            Left panel here
            <p>{stateName}</p>
        </div>
    );
}
