import { overlay } from "./l.js";

export function scrollable(root, { inset, signal }) {
    inset ??= 0;
    let barHeight = 0, nubHeight = 0, inactive = false, visible = false, withinScroll = false;
    const bar = document.createElement("div");
    bar.className = "scrollbar";
    overlay(root, { inset: inset + "px" }).add("top-right", bar);
    const updateNub = () => {
        const scale = root.offsetHeight / root.scrollHeight;
        if (scale === 1) {
            hide();
            inactive = true;
            return;
        } else inactive = false;
        nubHeight = Math.max(16, scale * barHeight);
        bar.style.setProperty("--nub-height", nubHeight + "px");
    };
    const padding = {};
    const observer = new ResizeObserver(() => {
        if (!padding.top) {
            const style = getComputedStyle(root);
            padding.top = parseFloat(style.paddingTop);
            padding.bottom = parseFloat(style.paddingBottom);
        }
        bar.style.top = -padding.top + "px";
        barHeight = root.offsetHeight + padding.bottom - 2 * inset;
        bar.style.height = barHeight + "px";
        updateNub();
    });
    observer.observe(root);

    const show = () => {
        if (visible || inactive) return;
        visible = true;
        bar.style.opacity = 1;
    }
    const hide = () => {
        if (!visible || withinScroll || inactive) return;
        visible = false;
        bar.style.opacity = 0;
    }
    root.addEventListener("scroll", () => {
        if (inactive) return;
        const scrollFactor = root.scrollTop / (root.scrollHeight - root.offsetHeight);
        bar.style.setProperty("--nub-top", `calc(${scrollFactor * 100}% - ${scrollFactor} * (var(--nub-height) + 3px))`);
        show();
    }, { signal });
    root.addEventListener("scrollend", hide, { signal });
    root.addEventListener("pointermove", show, { signal });
    root.addEventListener("pointerup", hide, { signal });
    root.addEventListener("pointerleave", hide, { signal });
    const move = (ev) => {
        const scrollFactor = (ev.offsetY - .5 * nubHeight) / (bar.offsetHeight - nubHeight);
        root.scrollTop = scrollFactor * (root.scrollHeight - root.offsetHeight);
        show();
    };
    bar.style.touchAction = "none";
    bar.addEventListener("pointerdown", (ev) => {
        if (!ev.isPrimary) return;
        withinScroll = true;
        move(ev);
        bar.setPointerCapture(ev.pointerId);
        bar.addEventListener("pointermove", move, { signal });
        root.style.touchAction = "none";
    }, { signal });
    const cancel = (ev) => {
        if (!ev.isPrimary) return;
        bar.removeEventListener("pointermove", move);
        bar.releasePointerCapture(ev.pointerId);
        root.style.touchAction = "";
        withinScroll = false;
        hide();
    };
    bar.addEventListener("pointerup", cancel, { signal });
    bar.addEventListener("pointercancel", cancel, { signal });
    root.forceScrollbarUpdate = updateNub;
    // this doesn't catch everything. use forceScrollbarUpdate if necessary
    const mutObserver = new MutationObserver(updateNub);
    mutObserver.observe(root, { subtree: true, childList: true });
    signal?.addEventListener("abort", () => observer.disconnect() || mutObserver.disconnect());
    return root;
}
