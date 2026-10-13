import P5 from "p5";
import Dot from "../Dot";
import Goal from "../Goal";
import { Ellipse, Line } from "../Obstacles";
import fakeP5 from "../testUtils/fakeP5";

const UP = -Math.PI / 2; // straight up the canvas (towards y = 0)

function dotWith(directions, { goal = new Goal(500, 10), obstacles = [] } = {}) {
    const p5 = fakeP5();
    const dot = new Dot(p5, goal, obstacles);
    dot.brain.directions = directions;
    return dot;
}

describe("obstacles and goal", () => {
    it("store positions as p5 vectors", () => {
        const line = new Line(0, 600, 800, 810);
        expect([line.p1.x, line.p1.y, line.p2.x, line.p2.y]).toEqual([0, 800, 600, 810]);
        const e = new Ellipse(3, 4);
        expect(e.pos).toBeInstanceOf(P5.Vector);
        expect([new Goal(1, 2).pos.x, new Goal(1, 2).pos.y]).toEqual([1, 2]);
    });
});

describe("Dot", () => {
    it("spawns bottom-centre, at rest, alive, with a 400-step brain", () => {
        const dot = new Dot(fakeP5(1000, 1000), new Goal(500, 10), []);
        expect([dot.pos.x, dot.pos.y]).toEqual([500, 990]);
        expect(dot.vel.mag()).toBe(0);
        expect(dot.brain.directions).toHaveLength(400);
        expect(dot.dead || dot.reachedGoal || dot.isBest).toBe(false);
    });

    it("move accelerates along the next brain direction and caps speed at 10", () => {
        const dot = dotWith(new Array(20).fill(UP));
        dot.move();
        expect(dot.brain.step).toBe(1);
        expect(dot.pos.x).toBeCloseTo(500);
        expect(dot.pos.y).toBeCloseTo(989);
        for (let i = 0; i < 15; i++) dot.move();
        expect(dot.vel.mag()).toBeCloseTo(10);
    });

    it("dies when it runs out of directions", () => {
        const dot = dotWith([UP]);
        dot.move();
        expect(dot.dead).toBe(false);
        dot.move();
        expect(dot.dead).toBe(true);
    });

    it("dies at the canvas edge", () => {
        const dot = dotWith(new Array(400).fill(Math.PI)); // head left
        for (let i = 0; i < 400 && !dot.dead; i++) dot.update();
        expect(dot.dead).toBe(true);
        expect(dot.pos.x).toBeLessThan(2);
    });

    it("reaches a goal directly above it (within 5px) and then stops updating", () => {
        const dot = dotWith(new Array(400).fill(UP), { goal: new Goal(500, 903) });
        for (let i = 0; i < 400 && !dot.reachedGoal && !dot.dead; i++) dot.update();
        expect(dot.reachedGoal).toBe(true);
        expect(dot.dead).toBe(false);
        const { step } = dot.brain;
        dot.update();
        expect(dot.brain.step).toBe(step);
    });

    it("dies on hitting a line obstacle in its path", () => {
        const wall = new Line(400, 600, 950, 950);
        const dot = dotWith(new Array(400).fill(UP), { obstacles: [wall] });
        for (let i = 0; i < 400 && !dot.dead; i++) dot.update();
        expect(dot.dead).toBe(true);
        expect(dot.pos.y).toBeGreaterThan(900);
    });

    it("checkObstacles: ellipse within 7px, line within its box (±5px vertically)", () => {
        const dot = dotWith([]);
        dot.pos = new P5.Vector(100, 100);
        expect(dot.checkObstacles(new Ellipse(105, 100))).toBe(true);
        expect(dot.checkObstacles(new Ellipse(108, 100))).toBe(false);
        expect(dot.checkObstacles(new Line(50, 150, 104, 104))).toBe(true);
        expect(dot.checkObstacles(new Line(50, 150, 106, 106))).toBe(false);
        expect(dot.checkObstacles(new Line(101, 150, 100, 100))).toBe(false);
    });

    it("fitness: goal-reachers beat everyone and fewer steps is better", () => {
        const goal = new Goal(500, 10);
        const fast = dotWith([], { goal });
        fast.reachedGoal = true;
        fast.brain.step = 50;
        const slow = dotWith([], { goal });
        slow.reachedGoal = true;
        slow.brain.step = 100;
        const near = dotWith([], { goal });
        near.pos = new P5.Vector(500, 12);
        const far = dotWith([], { goal });
        [fast, slow, near, far].forEach((d) => d.calculateFitness());

        expect(fast.fitness).toBeCloseTo(1 / 16 + 10000 / 2500);
        expect(near.fitness).toBeCloseTo(1 / 4);
        expect(far.fitness).toBeCloseTo(1 / 980 ** 2);
        expect(fast.fitness).toBeGreaterThan(slow.fitness);
        expect(slow.fitness).toBeGreaterThan(near.fitness);
        expect(near.fitness).toBeGreaterThan(far.fitness);
    });

    it("show draws the best dot larger and blue", () => {
        const dot = dotWith([]);
        dot.show();
        dot.isBest = true;
        dot.show();
        expect(dot.p5.calls).toEqual([
            ["fill", 0],
            ["ellipse", 500, 990, 4, 4],
            ["fill", 0, 0, 255],
            ["ellipse", 500, 990, 8, 8],
        ]);
    });
});
