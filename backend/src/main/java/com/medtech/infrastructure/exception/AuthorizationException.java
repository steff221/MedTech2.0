package com.medtech.infrastructure.exception;

import com.medtech.constant.ErrorCode;
import org.springframework.http.HttpStatus;

public class AuthorizationException extends AppException {

    public AuthorizationException(String message) {
        super(ErrorCode.AUTH_FORBIDDEN, HttpStatus.FORBIDDEN, message);
    }

    public AuthorizationException(String errorCode, String message) {
        super(errorCode, HttpStatus.FORBIDDEN, message);
    }

    /** 401 Unauthorized — credentials rejected. */
    public static AppException invalidCredentials() {
        return new AppException(ErrorCode.AUTH_INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED,
                "Invalid email or password") {};
    }
}
