async function IThrowErrorsFromSetTimeout() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            //throw new Error('This is an error from a setTimeout'); // doesn't work if we are in a Promise
            reject(new Error('This is an error from a setTimeout'));
        }, 500);
    });
}

async function ICatchErrorsFromSetTimeout() {
    setTimeout(() => {
        try {
            await IThrowErrorsFromSetTimeout();
        } catch (error) {
            console.log('Error I caught: ' + error);
        }
    }, 0);
}

async function ICatchErrors() {
    try {
        await IThrowErrorsFromSetTimeout();
    } catch (error) {
        console.log('Error I caught: ' + error);
    }
}

ICatchErrors();
ICatchErrorsFromSetTimeout();