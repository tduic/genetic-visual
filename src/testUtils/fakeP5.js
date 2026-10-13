// Minimal stand-in for a p5 sketch instance: canvas size, dist(), and
// recorded drawing calls. Vector math uses the real p5.Vector.
export default function fakeP5(width = 1000, height = 1000) {
    const calls = [];
    const record = (name) => (...args) => calls.push([name, ...args]);
    return {
        width,
        height,
        calls,
        dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
        fill: record("fill"),
        ellipse: record("ellipse"),
    };
}
