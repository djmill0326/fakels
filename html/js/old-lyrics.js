let toCompute = 0;
function normalizeWidth(el, root) {
    const text = el.textContent.split(" ");
    el.textContent = "";
    let height;
    let i = 0;
    let str;
    const newLine = () => {
        if (i === text.length) return testLines();
        const line = document.createElement("div");
        line.textContent = text[i++];
        el.append(line);
        height = 0;
        str = line.textContent;
        requestAnimationFrame(() => build(line));
    };
    const build = (line) => {
        if (!height) height = line.offsetHeight;
        if (line.offsetHeight > height) {
            line.textContent = str;
            i--;
            return newLine();
        }
        if (i === text.length) return testLines();
        str = line.textContent;
        line.textContent += " " + text[i++];
        requestAnimationFrame(() => build(line));
    };
    newLine();
    toCompute++;
    const testLines = () => {
        Array.from(el.children).forEach(testLine);
        toCompute--;
        if (toCompute === 0) root.classList.remove("pending");
    }
    const testLine = line => {
        line.style.display = "inline-block";
        const width = line.scrollWidth;
        el.classList.add("active");
        let min = 100, max = 100;
        if (line.scrollWidth < width) {
            while(line.scrollWidth < width) {
                min = max;
                max += 1;
                line.style.fontSize = max + "%";
            }
        } else {
            while(line.scrollWidth > width) {
                max = min;
                min -= 1;
                line.style.fontSize = min + "%";
            }
        }
        while (Math.abs(line.scrollWidth - width) >= 1) {
            const size = (max + min) / 2;
            line.style.fontSize = size + "%";
            if (line.scrollWidth > width) max = size;
            else min = size;
        }
        line.dataset.scale = line.style.fontSize || "100%";
        line.style.removeProperty("font-size");
        line.style.display = "block";
        el.classList.remove("active");
    }
}
