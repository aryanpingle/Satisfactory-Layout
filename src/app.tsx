import { PsigmaApp } from "./main";
import { StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { LeftPanel } from "./ui/LeftPanel";
import { Database } from "./database";
import { RightPanel } from "./ui/RightPanel";
import { SplitPane } from "@rexxars/react-split-pane";
import "@rexxars/react-split-pane/styles.css";
import { EVENT_EMITTER } from "./utils";
import debounce from "debounce";

export function App() {
    const canvasElementRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!canvasElementRef.current) return;

        // Initialize app
        const app = new PsigmaApp(canvasElementRef.current);
        app.render();

        // Listen for certain global events
        EVENT_EMITTER.addListener(
            "part_icon_loaded",
            debounce(() => app.render(), 100),
        );

        // Listen for canvas resize
        const r = new ResizeObserver(() => {
            app.canvas.onCanvasResize();
            app.render();
        });
        r.observe(canvasElementRef.current);
    }, []);

    return (
        <div className="w-full h-screen">
            <SplitPane
                split="vertical"
                allowResize
                minSize={200}
                defaultSize={300}
                maxSize={500}
            >
                <LeftPanel className="h-full" />
                <SplitPane
                    split="vertical"
                    allowResize
                    minSize={200}
                    defaultSize={300}
                    maxSize={500}
                    primary="second"
                >
                    <div className="h-full overflow-hidden relative">
                        <canvas
                            className="w-full"
                            ref={canvasElementRef}
                            id="canvas"
                            tabIndex={0}
                        />
                    </div>
                    <RightPanel className="h-full" />
                </SplitPane>
            </SplitPane>
        </div>
    );
}

await Database.loadPartIcon(undefined);
let appRoot;
if ((appRoot = document.querySelector("#app"))) {
    createRoot(appRoot).render(<App />);
}
