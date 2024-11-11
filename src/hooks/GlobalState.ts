import React from 'react';

type ChangedCallback<T> = (newState: T) => void;
type RenderCallback = () => void;

class GlobalState<T> {
    #state: T;
    #callbacks: RenderCallback[] = [];
    #onChange: ChangedCallback<T>|undefined;

    constructor(initState: T, onChange?:ChangedCallback<T>) {
        this.#state=initState;
        this.#onChange=onChange;
    }

    get(): T {
        return this.#state;
    }
    set(newState: T): this {
        if (newState === this.#state) {
            return this;
        }
        this.#state = newState;
        this.#callbacks.forEach(cb => cb());
        this.#onChange?.(newState);
        return this;
    }
    on(cb: RenderCallback): this {
        if (!this.#callbacks.includes(cb)) {
            this.#callbacks.push(cb);
        }
        return this;
    }
    off(cb: RenderCallback): this {
        for (let i = this.#callbacks.length - 1; i >= 0; --i) {
            if (this.#callbacks[i] === cb) {
                this.#callbacks[i] = this.#callbacks[this.#callbacks.length - 1];
                this.#callbacks.pop();
            }
        }
        return this;
    }
}

export function createGlobalState<T>(initState: T, onChange?: ChangedCallback<T>) {
    return new GlobalState(initState, onChange);
}
export function useGlobalState<T>(globalState: GlobalState<T>): [T, ChangedCallback<T>] {
    const [, set] = React.useState<T|object>(globalState.get());
    const state = globalState.get();
    const reRender = () => set({});

    React.useEffect(() => {
        globalState.on(reRender);
        return () => {
            globalState.off(reRender);
        };
    });

    function setState(newState: T) {
        globalState.set(newState);
    }

    return [state, setState];
}