"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockApiSuccess = mockApiSuccess;
exports.mockApiError = mockApiError;
exports.resetApiMock = resetApiMock;
const sinon = __importStar(require("sinon"));
const axios_1 = __importDefault(require("axios"));
// Use a stub to intercept any `axios.post` calls
const axiosStub = sinon.stub(axios_1.default, 'post');
/**
 * Mocks a successful response from an AI provider's API.
 * @param responseData The data you want the API to return.
 */
function mockApiSuccess(responseData) {
    axiosStub.resolves({ data: responseData, status: 200 });
}
/**
 * Mocks a failed response from an AI provider's API.
 * @param statusCode The HTTP status code to simulate.
 * @param errorMessage The error message to return.
 */
function mockApiError(statusCode, errorMessage) {
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
function resetApiMock() {
    axiosStub.reset();
}
//# sourceMappingURL=apiMocks.js.map