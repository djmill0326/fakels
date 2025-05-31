const opt = ["id", "href", "style", ["html", "innerHTML"], ["text", "innerText"], ["cls", "className"]]
const ret = ($, x, f) => { f(x); return $ }
const $$  = x => $(x)
const  $  = i => {
    const _   = typeof i === "string" ? document.createElement(i) : i.cls ? i.$ : i
    const $   = { $: _, get: {}, str: () => _.outerHTML, add: (...x) => ret($, x, x => _.append(...(x.map(x => $$(x).$)))) }
    const se  = t => x => { $.$[t] = x; return $ }; const ge = (x, k) => $.get[x] = () => $.$[k]
    opt.forEach(x => { if (typeof x === "string") { $[x] = se(x); ge(x, x) } else { $[x[0]] = se(x[1]); ge(x[0], x[1]) } })
    return $
}