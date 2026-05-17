package com.medtech.infrastructure.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base class for all expected (i.e. business / validation / auth) exceptions
 * thrown by the application. Subclasses pin a stable {@code errorCode} and
 * HTTP status; the {@link GlobalExceptionHandler} converts them into structured
 * {@link com.medtech.application.dto.response.ErrorResponse} payloads.
 *
 * <p>Never use this hierarchy for genuinely unexpected technical failures —
 * let those propagate so they are logged at ERROR and returned as 500.
 */
@Getter
public abstract class AppException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus status;

    protected AppException(String errorCode, HttpStatus status, String message) {
        super(message);
        this.errorCode = errorCode;
        this.status = status;
    }

    protected AppException(String errorCode, HttpStatus status, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.status = status;
    }
}
