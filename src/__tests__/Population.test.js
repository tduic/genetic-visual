import Population from "../Population";
import Goal from "../Goal";
import fakeP5 from "../testUtils/fakeP5";

afterEach(() => jest.restoreAllMocks());

const makePop = (size = 5) => new Population(fakeP5(), size, new Goal(500, 10), []);

describe("Population", () => {
    it("initializes popSize dots at generation 0", () => {
        const pop = makePop(7);
        expect(pop.dots).toHaveLength(7);
        expect(pop.gen).toBe(0);
        expect(pop.minStep).toBe(Number.MAX_SAFE_INTEGER);
    });

    it("allDotsDead is false while any dot is active, and records the first goal-reacher", () => {
        const pop = makePop(3);
        expect(pop.allDotsDead()).toBe(false);
        pop.dots[0].dead = true;
        pop.dots[1].reachedGoal = true;
        expect(pop.allDotsDead()).toBe(false);
        pop.dots[2].dead = true;
        expect(pop.allDotsDead()).toBe(true);
        expect(pop.firstDot).toBe(1);
    });

    it("update kills dots that are already slower than the best known solution", () => {
        const pop = makePop(2);
        pop.minStep = 3;
        pop.dots[0].brain.step = 4;
        pop.update();
        expect(pop.dots[0].dead).toBe(true);
        expect(pop.dots[1].brain.step).toBe(1);
        expect(pop.dots[1].dead).toBe(false);
    });

    it("calculateFitnessSum adds every dot's fitness", () => {
        const pop = makePop(3);
        pop.dots.forEach((d, i) => (d.fitness = i + 1));
        pop.calculateFitnessSum();
        expect(pop.fitnessSum).toBe(6);
    });

    it("selectParent is fitness-proportional (roulette wheel)", () => {
        const pop = makePop(3);
        [1, 2, 7].forEach((f, i) => (pop.dots[i].fitness = f));
        pop.calculateFitnessSum();
        const pick = (r) => {
            jest.spyOn(Math, "random").mockReturnValueOnce(r);
            return pop.dots.indexOf(pop.selectParent());
        };
        expect(pick(0)).toBe(0); // 0 < 1
        expect(pick(0.15)).toBe(1); // 1.5 in (1, 3]
        expect(pick(0.5)).toBe(2); // 5 in (3, 10]
    });

    it("setBestDot picks the fittest and tightens minStep when it reached the goal", () => {
        const pop = makePop(3);
        [1, 9, 3].forEach((f, i) => (pop.dots[i].fitness = f));
        pop.dots[1].reachedGoal = true;
        pop.dots[1].brain.step = 120;
        jest.spyOn(console, "log").mockImplementation(() => {});
        pop.setBestDot();
        expect(pop.bestDot).toBe(1);
        expect(pop.minStep).toBe(120);
    });

    it("selection keeps the champion's genes as an isBest clone and advances the generation", () => {
        const pop = makePop(4);
        pop.dots.forEach((d, i) => (d.fitness = i === 2 ? 10 : 1));
        const champion = [...pop.dots[2].brain.directions];
        pop.selection();
        expect(pop.gen).toBe(1);
        expect(pop.dots).toHaveLength(4);
        expect(pop.dots[0].isBest).toBe(true);
        expect(pop.dots[0].brain.directions).toEqual(champion);
        expect(pop.dots.slice(1).every((d) => !d.isBest && d.brain.step === 0)).toBe(true);
    });

    it("getChild copies the parent's brain into a fresh dot", () => {
        const pop = makePop(1);
        const parent = pop.dots[0];
        parent.brain.step = 33;
        parent.dead = true;
        const child = pop.getChild(parent);
        expect(child).not.toBe(parent);
        expect(child.brain.directions).toEqual(parent.brain.directions);
        expect(child.brain.step).toBe(0);
        expect(child.dead).toBe(false);
    });

    it("mutation mutates every dot's brain", () => {
        const pop = makePop(3);
        const spies = pop.dots.map((d) => jest.spyOn(d.brain, "mutate"));
        pop.mutation();
        spies.forEach((s) => expect(s).toHaveBeenCalledTimes(1));
    });
});
