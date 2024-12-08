export function createProgressTracker() {
    const progress = [];
    return {
        add: (message) => progress.push(message),
        get: () => [...progress], // Return een kopie van de voortgang
    };
}
