import { App as PsigmaApp } from "./main";
import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { LeftPanel } from "./ui/LeftPanel";
import { Database } from "./database";

export function App() {
    const canvasElementRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasElementRef.current) return;

        const app = new PsigmaApp(canvasElementRef.current);

        // Load database
        Database.loadPartIcon(undefined).then(() => {
            app.render();
        });

        window.addEventListener("resize", () => {
            app.canvas.onCanvasResize();
            app.render();
        });
    });

    return (
        <div className="grid grid-flow-col grid-cols-[15rem_1fr_20rem] w-full h-full">
            <LeftPanel className="" />
            <div className="overflow-hidden relative">
                <canvas
                    className="w-full"
                    ref={canvasElementRef}
                    id="canvas"
                    tabIndex={0}
                />
            </div>
            <div className="right_panel">Right panel here</div>
        </div>
    );
}

let appRoot;
if ((appRoot = document.querySelector("#app"))) {
    createRoot(appRoot).render(
        <StrictMode>
            <App />
        </StrictMode>,
    );
}
