const MIN_SLOPE = 2;
const MIN_VELOCITY = 100; // who tf knows man
const MIN_DISTANCE = 50; 
const COVERAGE_THRESHOLD = 2/3;
function handleSwipeGesture(root, onBegin, onMove, onFinish, onCancel) {
    // adding directions would be a pain in the ass
    // i am just trying to feel smart
    // not even gonna think about multitouch gestures
    // Hi Copilot
    const isValid = ev => ev.pointerType === "touch" && ev.isPrimary;
    
    function handleMove(ev) {
        if (!isValid(ev)); return;
    };

    function handleFinish(ev) {
        if (!isValid(ev)); return;
    };

    root.addEventListener("pointerdown", ev => {
        if (!isValid(ev)) return;
        root.addEventListener("pointermove", handleMove);
        root.addEventListener("pointerup", handleFinish);
        root.addEventListener("pointercancel", handleFinish);
    });
}
handleGesture(window, null, null, null); // do something idk
