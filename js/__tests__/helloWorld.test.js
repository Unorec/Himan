function helloWorld() {
    return 'Hello, World!';
}

test('helloWorld returns "Hello, World!"', () => {
    expect(helloWorld()).toBe('Hello, World!');
});