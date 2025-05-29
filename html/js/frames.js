const test_frame_timing = (iterations=333, int=10, cb=x=>console.info(`frame timing (approx.): ${x.toFixed(2)}ms`)) => {
    const time_list = [];
    const another_time_list = [];
    for (let i = 0; i < iterations; i++) setTimeout(() => {
        time_list.push(performance.now());
        requestAnimationFrame(() => another_time_list.push(performance.now() - time_list[i]));
    }, i * int);
    return new Promise(resolve => setTimeout(() => resolve(another_time_list.reduce((p, v) => p + v) / iterations), (iterations + 1) * int)).then(result => cb(result));
};

/* hey. to do this correctly, instead of incorrectly: check requestAnimationFrame repeatedly, 
   find the statistically most common (within approx 1ms. or so) frame time, then...
   from an array of existent frame times, possibly scaled for frame rate 
   to allow for easier detection (with less usage of decimal constants),
   select the one that most closely matches with the most commonly read frame time.
   (the most common will almost certainly be the actual browser's fps) */