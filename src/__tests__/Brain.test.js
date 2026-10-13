import Brain from "../Brain";

afterEach(() => jest.restoreAllMocks());

describe("Brain", () => {
    it("starts at step 0 with `size` random angles in [0, 2π)", () => {
        const brain = new Brain(400);
        expect(brain.step).toBe(0);
        expect(brain.directions).toHaveLength(400);
        for (const a of brain.directions) {
            expect(a).toBeGreaterThanOrEqual(0);
            expect(a).toBeLessThan(2 * Math.PI);
        }
    });

    it("randomize scales Math.random by 2π", () => {
        jest.spyOn(Math, "random").mockReturnValue(0.25);
        expect(new Brain(3).directions).toEqual([
            Math.PI / 2,
            Math.PI / 2,
            Math.PI / 2,
        ]);
    });

    it("clone copies the parent's directions without aliasing", () => {
        const parent = { brain: new Brain(10) };
        const child = new Brain(10);
        child.clone(parent);
        expect(child.directions).toEqual(parent.brain.directions);
        expect(child.directions).not.toBe(parent.brain.directions);
        child.directions[0] = -1;
        expect(parent.brain.directions[0]).not.toBe(-1);
    });

    it("mutate replaces a gene only when the roll is under 1%", () => {
        const brain = new Brain(2);
        brain.directions = [1, 2];
        // gene 0: roll 0.005 -> 0 (< 1) mutates to 0.5 * 2π; gene 1: roll 0.5 -> 50 keeps.
        jest.spyOn(Math, "random")
            .mockReturnValueOnce(0.005)
            .mockReturnValueOnce(0.5)
            .mockReturnValueOnce(0.5);
        brain.mutate();
        expect(brain.directions).toEqual([Math.PI, 2]);
    });

    it("mutate leaves every gene alone when all rolls are >= 1%", () => {
        const brain = new Brain(50);
        const before = [...brain.directions];
        jest.spyOn(Math, "random").mockReturnValue(0.01);
        brain.mutate();
        expect(brain.directions).toEqual(before);
    });
});
