export default function marquee(el) {
    el.style.willChange = "transform";
    let originalText = el.textContent;
    const updateMarquee = (text) => {
        originalText = text;
        el.style.animation = "none";
        el.textContent = text;
        const boundWidth = el.offsetWidth;
        const width = el.scrollWidth;
        if (width > boundWidth) {
            el.textContent = text = `${originalText} – ${originalText}`;
            const distance = el.scrollWidth - width;
            el.style.setProperty("--distance", `${-distance}px`);
            el.style.animation = `marquee ${distance/50}s linear infinite`;
            el.style.animationDelay = "1s";
        }
        el.style.overflow = "visible";
    };
    const observer = new ResizeObserver(() => updateMarquee(originalText));
    observer.observe(el);
    updateMarquee();
    return updateMarquee;
}
