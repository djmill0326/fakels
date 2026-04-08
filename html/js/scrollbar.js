import { overlay } from "./l.js";

export function scrollable(root, { inset, signal, anchors, vscroll, backing }) {
    inset ??= 0;
    let barHeight = 0, nubHeight = 0, inactive = false, visible = false, withinScroll = false, anchorEls = [], barX = 0, offsetHeight, scrollHeight, scale;
    const bar = document.createElement("div");
    bar.className = anchors ? "scrollbar anchored" : "scrollbar";
    overlay(root, { inset: inset + "px" }).add("top-right", bar);
    if (anchors) {
        const anchorContainer = document.createElement("div");
        anchors.forEach(([_, name], i) => {
            const el = document.createElement("span");
            el.textContent = name;
            anchorEls.push(el);
            anchorContainer.append(el);
            el._index = i;
        });
        bar.append(anchorContainer);
        bar.style.setProperty("--inner-width", "1000px");
        requestAnimationFrame(() => {
            let maxWidth = 0;
            for (const el of anchorEls) {
                if (el.offsetWidth > maxWidth) maxWidth = el.offsetWidth;
            }
            bar.style.setProperty("--inner-width", maxWidth + 4 + "px");
            anchorContainer.style.display = "flex";
        }, 0);
    }
    const updateNub = () => {
        if (scale === 1) {
            hide();
            inactive = true;
            return;
        } else inactive = false;
        nubHeight = anchors ? 6 : Math.max(16, scale * barHeight);
        bar.style.setProperty("--nub-height", nubHeight + "px");
    };
    const padding = {};
    const resize = () => {
        if (!padding.top) {
            const style = getComputedStyle(root);
            padding.top = parseFloat(style.paddingTop);
            padding.bottom = parseFloat(style.paddingBottom);
        }
        offsetHeight = root.offsetHeight;
        scrollHeight = root.scrollHeight;
        scale = offsetHeight / scrollHeight;
        bar.style.top = -padding.top + "px";
        barHeight = offsetHeight + padding.bottom - 2 * inset;
        bar.style.height = barHeight + "px";
        updateNub();
        const rect = bar.getBoundingClientRect();
        barX = rect.left + .5 * rect.width;
    }
    const observer = new ResizeObserver(resize);
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
        let scrollFactor;
        if (anchors) {
            const head = vscroll.head().id;
            let i;
            for (let j = anchors.length - 1; j >= 0; j--)
                if (head < anchors[j][0]) i = j - 1;
            if (i == null) i = anchors.length - 1;
            const top = anchors[i][0];
            const bottom = anchors[i + 1]?.[0] ?? backing.length;
            const progress = (head - top) / (bottom - top);
            const el = anchorEls[i];
            scrollFactor = (el.offsetTop + progress * el.offsetHeight) / root.offsetHeight;
        } else scrollFactor = root.scrollTop / (scrollHeight - offsetHeight);
        bar.style.setProperty("--nub-top", `calc(${scrollFactor * 100}% - ${scrollFactor} * (var(--nub-height) + 3px))`);
        show();
    }, { signal });
    root.addEventListener("scrollend", hide, { signal });
    root.addEventListener("pointermove", show, { signal });
    root.addEventListener("pointerup", hide, { signal });
    root.addEventListener("pointerleave", hide, { signal });
    const move = (ev) => {
        show();
        if (anchors) {
            const el = document.elementFromPoint(barX, ev.clientY);
            const a = el._index;
            if (a == null) return;
            const rect = el.getBoundingClientRect();
            const progress = (ev.clientY - rect.top) / (rect.height);
            const top = anchors[a][0];
            const bottom = anchors[a + 1]?.[0] ?? backing.length;
            const i = Math.round(top + progress * (bottom - top));
            vscroll.scrollTo(i);
            return;
        }
        const scrollFactor = (ev.offsetY - .5 * nubHeight) / (bar.offsetHeight - nubHeight);
        root.scrollTop = scrollFactor * (scrollHeight - offsetHeight);
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
    root.forceScrollbarUpdate = resize;
    signal?.addEventListener("abort", () => observer.disconnect());
    return root;
}
