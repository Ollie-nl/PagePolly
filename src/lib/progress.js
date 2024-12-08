export function createProgressTracker() {
    const progress = [];
    return {
        add: (message) => progress.push(message),
        get: () => [...progress], // Geef een kopie terug
    };
}
