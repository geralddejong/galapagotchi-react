import {Fabric} from '../body/fabric';
import {Behavior} from '../genetics/behavior';
import {Genome} from '../genetics/genome';
import {Embryology} from '../genetics/embryology';

export class Gotchi {
    public frozen = false;
    public catchingUp = false;
    public rebornClone?: Gotchi;
    public offspring?: Gotchi;
    private embryology?: Embryology;
    private behavior: Behavior;
    private hangingCountdown: number;
    private restCountdown: number;
    private mature = false;

    constructor(public fabric: Fabric, private genome: Genome, private hangingDelay: number, private restDelay: number) {
        this.embryology = genome.embryology(fabric);
        this.behavior = genome.behavior(fabric);
        this.hangingCountdown = hangingDelay;
        this.restCountdown = restDelay;
    }

    public get age() {
        return this.fabric.age;
    }

    public get distance() {
        if (this.fabric.age === 0) {
            throw new Error('Zero age midpoint!');
        }
        const midpoint = this.fabric.midpoint;
        return Math.sqrt(midpoint.x * midpoint.x + midpoint.z * midpoint.z);
    }

    public withNewBody(fabric: Fabric): Gotchi {
        return new Gotchi(fabric, this.genome, this.hangingDelay, this.restDelay);
    }

    public mutateBehavior(mutations: number): void {
        this.genome = this.genome.withMutatedBehavior(mutations);
    }

    public iterate(ticks: number): number {
        if (this.frozen) {
            return 0;
        }
        const maxTimeSweep = this.fabric.iterate(ticks, this.hangingCountdown > 0);
        if (maxTimeSweep === 0) {
            if (this.mature) {
                this.triggerAllIntervals();
            } else {
                if (this.embryology) {
                    const successful = this.embryology.step();
                    if (!successful) {
                        this.embryology = undefined;
                    }
                } else if (this.hangingCountdown > 0) {
                    this.hangingCountdown -= ticks;
                    if (this.hangingCountdown <= 0) {
                        this.fabric.removeHanger();
                    }
                } else if (this.restCountdown > 0) {
                    this.restCountdown -= ticks;
                } else {
                    this.behavior.apply();
                    this.triggerAllIntervals();
                    this.mature = true;
                }
            }
        }
        return maxTimeSweep;
    }

    public get growing(): boolean {
        return !!this.embryology;
    }

    public triggerAllIntervals() {
        for (let intervalIndex = 0; intervalIndex < this.fabric.intervalCount; intervalIndex++) {
            this.fabric.triggerInterval(intervalIndex);
        }
    }

    public get genomeString(): string {
        return [this.genome.behaviorData.join(','), this.genome.behaviorData.join(',')].join(';')
    }
}