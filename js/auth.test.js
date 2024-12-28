describe('AuthenticationSystem.handleAuthentication', () => {
    let authSystem;
    let mockEvent;

    beforeEach(() => {
        // Mock DOM elements
        document.body.innerHTML = `
            <form id="loginForm">
                <input id="username" />
                <input id="password" />
                <button id="loginButton">Login</button>
                <div id="loginError"></div>
            </form>
        `;

        authSystem = new AuthenticationSystem();
        mockEvent = {
            preventDefault: jest.fn()
        };
    });

    test('should prevent default form submission', () => {
        authSystem.handleAuthentication(mockEvent);
        expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    test('should call authenticateUser with trimmed username and password', () => {
        authSystem.elements.usernameInput.value = ' testuser ';
        authSystem.elements.passwordInput.value = ' password123 ';
        
        const spy = jest.spyOn(authSystem, 'authenticateUser');
        
        authSystem.handleAuthentication(mockEvent);
        
        expect(spy).toHaveBeenCalledWith('testuser', 'password123');
    });

    test('should call handleSuccessfulLogin on successful authentication', () => {
        const mockAuthResult = {
            success: true,
            user: 'testuser',
            role: 'staff'
        };
        
        jest.spyOn(authSystem, 'authenticateUser').mockReturnValue(mockAuthResult);
        const spy = jest.spyOn(authSystem, 'handleSuccessfulLogin');
        
        authSystem.handleAuthentication(mockEvent);
        
        expect(spy).toHaveBeenCalledWith(mockAuthResult);
    });

    test('should call handleFailedLogin on failed authentication', () => {
        const mockAuthResult = {
            success: false,
            message: '帳號或密碼不正確'
        };
        
        jest.spyOn(authSystem, 'authenticateUser').mockReturnValue(mockAuthResult);
        const spy = jest.spyOn(authSystem, 'handleFailedLogin');
        
        authSystem.handleAuthentication(mockEvent);
        
        expect(spy).toHaveBeenCalledWith(mockAuthResult.message);
    });
});