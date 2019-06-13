class Pipeline {
    /**
     * Add a step to the pipeline.
     *
     * @param {} method Object or Function representing the step to be added to the pipeline.
     * @param {} meta Data to be provided to the step when the step is ran.
     */
    step (method, meta) {
        if (!(this.steps instanceof Array)) {
            this.steps = [];
        }

        switch (typeof method) {
        case 'object':
            this.steps.push({
                method: (async (data, step) => { return await method.run(data, step) }),
                meta: meta || method
            });
            break;

        default:
            this.steps.push({ method, meta: meta || {} });
            break;

        }

        return this;

    };

    /**
     * Iterates over a list of items and creates a subprocess for each.  These steps will not block
     * each other, but the pipeline will wait until all steps are fullfilled before
     * moving on to the next step.
     *
     * @param {} method Object or Function representing the step to be added to the pipeline.
     * @param {Object|Array} list Iterable object that will each be passed into the step
     * @param {} meta Data to be provided to the step when the step is ran.
     */
    each (method, list, meta) {
        return this.step(
            (data) => {
                const children = [];

                for (let index in list) {
                    children.push(method(data, list[index], index));
                };

                return Promise.all(children);
            },
            meta || {}
        );

    };

    /**
     * Execute the pipeline as defined.
     *
     * @param {} data Initial pipeline data payload
     */
    exec(data) {
        let promise = Promise.resolve(data || {});

        if (this.steps instanceof Array) {
            this.steps.forEach(step => {
                [Pipeline.before, step.method, Pipeline.after].forEach((method) => {
                    promise = promise.then(Pipeline.then(method, step.meta));

                });

            });

        }

        return promise;

    };

    /**
     * Wrapper function for Promise.then -- used to control how data is returned
     * from each step, and to account for steps with uncallable methods.
     *
     * @param {Function} method Method to be called.
     * @param {*} meta Data to be provided to the method when called.
     */
    static then(method, meta) {
        return async (data) => {
            if (method) {
                await method(data, meta);
            }

            return data;

        };

    };

    /**
     * Returns a new empty object that has been pushed to the end of the
     * provided array -- used for calls to Pipeline.each to tie in
     * child pipelines to the parent pipeline data.
     *
     * @param {Array} array Array to hold new object that is returned
     */
    static iterate(array) {
        return array[array.push({}) - 1];
    };

    /**
     * Returns a new empty object that has been pushed set to the provided
     * index in the provided array -- used for calls to Pipeline.each to
     * tie in child pipelines to the parent pipeline data.
     *
     * @param {Array} array Array to hold new object that is returned
     * @param {String|Number} index Index of new object in the Array
     */
    static itemize(array, index) {
        return (array[index] = {});
    };

};

module.exports = Pipeline;
