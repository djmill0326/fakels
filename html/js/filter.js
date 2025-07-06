const sr_min = document.getElementById("sr-min");
const sr_max = document.getElementById("sr-max");
const ar_min = document.getElementById("ar-min");
const ar_max = document.getElementById("ar-max");
const bpm_min = document.getElementById("bpm-min");
const bpm_max = document.getElementById("bpm-max");
const bpm_scaled = document.getElementById("bpm-scaled");
const status_ranked = document.getElementById("status-ranked");
const status_loved = document.getElementById("status-loved");
const status_pending = document.getElementById("status-pending");
const filter_string = document.getElementById("filter-string");

const elements = { sr_min, sr_max, ar_min, ar_max, bpm_min, bpm_max, bpm_scaled };

const createRangeIndicator = (element, suffix, transform = x => x) => {
    const setText = () => { value.innerText = transform(element.value).toString() + suffix; };
    const container = element.parentElement;
    const value = document.createElement("span");
    setText();
    element.addEventListener("input", setText);
    container.append(value);
    return setText;
}

const range_indicators = {
    sr_min: createRangeIndicator(sr_min, "*", x => x / 10),
    sr_max: createRangeIndicator(sr_max, "*", x => x / 10),
    ar_min: createRangeIndicator(ar_min, "", x => x / 10),
    ar_max: createRangeIndicator(ar_max, "", x => x / 10),
    bpm_min: createRangeIndicator(bpm_min, " BPM"),
    bpm_max: createRangeIndicator(bpm_max, " BPM")
};

let bpm_scale_factor = 1;

const updateBpmScaling = scale_bpm => {
    bpm_scale_factor = scale_bpm ? 2/3 : 1;
}

const fixWhitespace = text => {
    let text_trimmed = "";
    let needs_space = false;
    for (const i in text) {
        const c = text[i];
        if (c === "\n") {
            continue;
        } else if (c !== " ") {
            text_trimmed += c;
            needs_space = true;
        } else if (needs_space) {
            text_trimmed += " ";
            needs_space = false;
        }
    }
    return text_trimmed;
};

const fixWhitespaceDank = text => text.split("").reduce((a, c) => a + (c === " " ? (!a || a.endsWith(" ") ? "" : " ") : (c === "\n" ? "" : c)), "");

const updateFilterString = () => {
    filter_string.innerText = fixWhitespaceDank(fixWhitespace(`
        mode=o 
        stars>=${sr_min.value / 10} 
        stars<=${sr_max.value / 10} 
        bpm>=${(bpm_min.value * bpm_scale_factor).toFixed(0)} 
        bpm<=${(bpm_max.value * bpm_scale_factor).toFixed(0)} 
        ar>=${ar_min.value / 10} 
        ar<=${ar_max.value / 10} 
        ${status_ranked.checked ? "" : "status!=r"} 
        ${status_loved.checked ? "" : "status!=l"} 
        ${status_pending.checked ? "" : "status!=p"} 
        status!=n
    `));
};
const applyPreset = preset => {
    if(preset.bpm_scaled !== undefined) {
        updateBpmScaling(preset.bpm_scaled);
    }
    
    for (const value in preset) {
        if (typeof preset[value] === "boolean") {
            elements[value].checked = preset[value];
        } else {
            elements[value].value = preset[value];
            range_indicators[value]();
        }
    }

    updateFilterString();
};

const presets = {
    default: {
        sr_min: 60,
        sr_max: 90,
        ar_min: 80,
        ar_max: 100,
        bpm_min: 0,
        bpm_max: 400,
        bpm_scaled: false
    },
    speed: {
        sr_min: 60,
        sr_max: 120,
        ar_min: 90,
        ar_max: 100,
        bpm_min: 210,
        bpm_max: 260,
        bpm_scaled: false
    },
    speed_hi: {
        sr_min: 70,
        sr_max: 120,
        ar_min: 90,
        ar_max: 100,
        bpm_min: 230,
        bpm_max: 400,
        bpm_scaled: false
    },
    dt: {
        sr_min: 60,
        sr_max: 100,
        ar_min: 80,
        ar_max: 98,
        bpm_min: 0,
        bpm_max: 400,
        bpm_scaled: true
    },
    dt_comfy: {
        sr_min: 65,
        sr_max: 100,
        ar_min: 85,
        ar_max: 95,
        bpm_min: 220,
        bpm_max: 300,
        bpm_scaled: true
    }
};

const initPresetButtons = () => {
    for (const name in presets) {
        document.getElementById("preset-" + name).addEventListener("click", () => { applyPreset(presets[name]) });
    }
};

bpm_scaled.addEventListener("change", () => { updateBpmScaling(bpm_scaled.checked); });
document.querySelector("form").addEventListener("change", updateFilterString);

initPresetButtons();
updateFilterString();

// [WARN] EVIL CODE INCOMING: CSS-in-JS *dies*

const styleTexts = [
    `
        :root * {
            box-sizing: border-box;
        }
        body {
            transform: translate(-2.8em, -2em);
            padding: 0;
            margin: 0;
            scale: .8;
            height: 100svh;
            color-scheme: dark;
            background: #3CC6D9;
            background: radial-gradient(circle,rgba(60, 198, 217, 1) 11%, rgba(254, 73, 99, 1) 89%);
            backdrop-filter: blur(2em) grayscale(.1)
        }
    `,
    ``
];

const styleTextMap = {
    default: 1,
    styled: 0
};

function withCastration(uponWhat=document.head, styleVersion="styled") {
    const s_el = document.createElement("style");
    s_el.innerHTML = styleTexts[styleTextMap[styleVersion]];
    document.head.append(s_el);
    return s_el;
}

// Garbage Collection in GC'd Language!! LOL Eat Shit "Systems Engineers" -- up yours! xdd
const primaryStyle = withCastration.apply(this, [void 0, void 0]);
delete primaryStyle;