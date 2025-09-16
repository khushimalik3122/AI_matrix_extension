import * as sinon from 'sinon';
import axios from 'axios';

// Use a stub to intercept any `axios.post` calls
const axiosStub = sinon.stub(axios, 'post');

/**
 * Mocks a successful response from an AI provider's API.
 * @param responseData The data you want the API to return.
 */
export function mockApiSuccess(responseData: any) {
    axiosStub.resolves({ data: responseData, status: 200 });
}

/**
 * Mocks a failed response from an AI provider's API.
 * @param statusCode The HTTP status code to simulate.
 * @param errorMessage The error message to return.
 */
export function mockApiError(statusCode: number, errorMessage: string) {
    axiosStub.rejects({
        response: {
            status: statusCode,
            data: { error: { message: errorMessage } }
        }
    });
}

/**
 * Resets the mock to clear its history and behavior.
 * This should be called after each test to ensure isolation.
 */
export function resetApiMock() {
    axiosStub.reset();
}
