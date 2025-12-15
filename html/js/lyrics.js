function normalizeWidth(el) {
    const words = el.textContent.split(/\s+/);
    el.textContent = "";
    el.style.paddingLeft = "1px";
    let i = 0;

    while (i < words.length) {
        const line = document.createElement("div");
        let str = words[i++];
        line.textContent = str;
        el.append(line);

        const baseHeight = line.offsetHeight;

        while (i < words.length) {
            const testStr = str + " " + words[i];
            line.textContent = testStr;
            if (line.offsetHeight > baseHeight) {
                line.textContent = str;
                break;
            }
            str = testStr;
            i++;
        }
    }

    el.style.removeProperty("padding-left");
    Array.from(el.children).forEach(testLine);

    function testLine(line) {
        line.style.display = "inline-block";
        const width = line.scrollWidth;
        el.classList.add("active");
        let min = 100, max = 100;

        if (line.scrollWidth < width) {
            while (line.scrollWidth < width) {
                min = max;
                max += 1;
                line.style.fontSize = max + "%";
            }
        } else {
            while (line.scrollWidth > width) {
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

function renderLine(time, text, root) {
    const el = document.createElement("a");
    el.className = "lyrics-text";
    el.innerText = text || "♫";
    el.style.display = "block";
    root.append(el);
    if(time !== -1) {
        el.dataset.time = time.toFixed(2);
        el.href = "#";
        normalizeWidth(el);
    }
    return [time, el];
}

const parseLyrics = (text, root) => text.split("\n").map(line => {
    line = line.trim();
    if (!line.startsWith("[")) return line.length ? renderLine(-1, line, root) : undefined;
    const timeEnd = line.indexOf("]");
    if (timeEnd === -1) return;
    const timeStr = line.slice(1, timeEnd);
    const [m, s] = timeStr.split(":").map(Number);
    if (isNaN(m) || isNaN(s)) return;
    return renderLine(m * 60 + s, line.slice(timeEnd + 1).trim(), root);
}).filter(Boolean);

export async function showLyrics(src, root, audio, status) {
    try {
        status?.enable();
        const text = src.text ?? await (await fetch(src)).text();
        root.className = "lyrics";
        const data = parseLyrics(text, root);
        status?.disable();
        const path = src.path ?? src.slice(0, -4);
        let currentLine;
        const select = el => {
            if (currentLine) {
                currentLine.classList.remove("active");
                for (const line of currentLine.children)
                    line.style.removeProperty("font-size");
            }
            for (const line of el.children)
                line.style.fontSize = line.dataset.scale;
            el.classList.add("active");
            currentLine = el;
            (el.previousElementSibling ?? el).scrollIntoView({ behavior: "smooth" });
        }
        const isLyrics = el => el.classList.contains("lyrics-text");
        root.addEventListener("click", ev => {
            let target = isLyrics(ev.target) ? ev.target : isLyrics(ev.target.parentElement) ? ev.target.parentElement : undefined;
            if (!target) return;
            ev.preventDefault();
            if (!audio.src.includes(path) || !target.dataset.time) return;
            select(target);
            audio.currentTime = parseFloat(target.dataset.time);
            audio.play();
        });
        audio.addEventListener("timeupdate", () => {
            if (!audio.src.includes(path)) return;
            for (let i = data.length - 1; i >= 0; i--) {
                const [time, el] = data[i];
                if (time !== -1 && audio.currentTime + .001 >= time) {
                    if (currentLine !== el) select(el);
                    break;
                }
            }
        });
    } catch (err) {
        status?.disable();
        root.innerText = "Failed to get lyrics";
    }
}
